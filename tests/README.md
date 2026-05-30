# Viralefy front-end test suite

Four suites, runnable via `npm`, with **zero new npm dependencies**. They
rely on the Node 25+ built-in test runner, `curl`, and `fetch()`.

## Layout

```
tests/
├── README.md             (this file)
├── ts-loader.mjs         (Node module-customization registrar)
├── ts-loader-hooks.mjs   (transpiles .ts via local tsc + resolves @/ alias)
├── unit/                 (node --test, hits pure functions in src/)
│   ├── categories.test.mjs
│   ├── countries.test.mjs
│   ├── format.test.mjs
│   ├── indexnow.test.mjs
│   ├── jsonld.test.mjs
│   ├── languages.test.mjs
│   ├── legal-render.test.mjs
│   └── search-corpus.test.mjs
├── smoke/run.sh          (curl every public URL, check shape + headers)
├── pentest/probes.sh     (non-destructive security probes)
└── emulated/
    ├── browse-flow.mjs   (fetch-driven user browse path)
    └── checkout-flow.mjs (creates one pending order against /v1/checkout)
```

## How to run

```bash
npm test                       # unit suite (node --test)
npm run test:smoke             # production smoke (curl)
npm run test:pentest           # security probes (curl + openssl)
npm run test:emulated:browse   # fetch() browse flow
npm run test:emulated:checkout # creates one pending order on the API
npm run test:all               # unit + smoke + pentest + emulated:browse
```

All scripts accept env-var overrides:

| Var               | Default                       | Used by             |
| ----------------- | ----------------------------- | ------------------- |
| `SITE_URL`        | `https://viralefy.com`        | smoke / pentest / emulated |
| `API_URL`         | `https://api.viralefy.com`    | pentest / emulated  |
| `SMOKE_TIMEOUT`   | `15` (seconds)                | smoke               |
| `SMOKE_VERBOSE`   | `0`                           | smoke               |
| `PENTEST_TIMEOUT` | `15` (seconds)                | pentest             |
| `TEST_EMAIL`      | auto-generated                | emulated:checkout   |

To run a single unit test file:

```bash
node --import ./tests/ts-loader.mjs --test tests/unit/categories.test.mjs
```

## What each suite covers

### Unit (`tests/unit/*.test.mjs`)

Pure-function correctness for the i18n/SEO/format layer. Each file uses
`node:test` + `node:assert/strict` and imports the real `.ts` modules
under `src/` via the loader hook in `tests/ts-loader-hooks.mjs`. That
hook calls the bundled `typescript` compiler (already in `node_modules`)
to strip types — no extra packages needed.

| File                       | Coverage                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `categories.test.mjs`      | `categoryFromSlug`, `categorySlug`, `categoryLabel`, `copyFor` + LongCopy shape |
| `languages.test.mjs`       | `langOfCountry` fallbacks, `tr(...)` per-pack strings, all PACKS sane    |
| `countries.test.mjs`       | catalog cardinality, ISO codes, regions, BCP47 lang, `getCountry`, `countriesByRegion` sorting |
| `format.test.mjs`          | `priceFor` formatting for BRL/USD/EUR + BTC fallback                     |
| `jsonld.test.mjs`          | shape of `buildCountryJsonLd` blocks (Organization/WebSite/WebPage/Breadcrumb/Service+AggregateOffer) |
| `legal-render.test.mjs`    | markdown-lite renderer: h2 counting, bullet merging, unique keys         |
| `indexnow.test.mjs`        | `envIndexNow` + `keyLocation` use site URL + key from env                |
| `search-corpus.test.mjs`   | re-implements `buildIndex`/`search` from SearchBar (client component) and asserts size, query matching, multi-token AND, EXTRA_KEYWORDS hook for "recuperação" |

Why some helpers are re-implemented: `SearchBar.tsx` is a `"use client"`
React component whose `buildIndex` and `search` are module-private. We
mirror them in the test file (with a TODO-style comment) so any drift
in production has to be intentionally re-applied in the test too.

Likewise, `lib/jsonld.ts` and `lib/site-urls.ts` use the `@/...` path
alias **and** import types from `lib/api.ts` (which talks to the API).
The hook resolves `@/...` for us, but `jsonld.test.mjs` carries an
inline mirror of the function so the test stays hermetic and does not
require a live API. `lib/site-urls.ts` is currently exercised by smoke
tests (`/sitemap.xml`) rather than unit tests.

### Smoke (`tests/smoke/run.sh`)

`curl`-based asserts that the production site responds with the right
shape:

1. Core routes return 200 with substantial body
2. Per-country subsites are reachable
3. Per-country/category routes resolve
4. Deep plan routes resolve
5. Legal docs are served at `/legal/{slug}?lang=...`
6. `hreflang` tags appear on `/` (currently INFO if not present)
7. JSON-LD blocks are embedded on `/` and `/br`
8. GTM/gtag tag is present on `/` (INFO if not)
9. `/sitemap.xml` is well-formed XML and lists at least 200 URLs
10. The IndexNow keyfile `adcfcb...txt` is served at the site root
11. `/robots.txt` is served (informational)

PASS/FAIL/INFO summary is printed and the script exits non-zero only
on FAIL (INFO is observational).

### Pentest (`tests/pentest/probes.sh`)

**Non-destructive** probes — no real exploitation, no credential
brute-force, no DoS. Each probe is one or a small number of requests.

1. `GET /v1/admin/*` without a token returns 401/403
2. `GET /v1/admin/*` with a garbage Bearer token returns 401/403
3. `GET /v1/plans?id='%20OR%201%3D1--` — SQLi sentinel returns non-5xx
4. `GET /<script>alert(1)</script>` — URL with raw script body returns 404 and the payload is not echoed
5. `POST /v1/me/orders` from a foreign Origin without a token returns 401/403
6. `GET /legal/../../etc/passwd` returns 404
7. `GET /?redirect=https://evil.example.com` does not set a `Location` to `evil.example.com`
8. `POST /api/indexnow` without `x-indexnow-secret` returns 401/403 (currently INFO — see below)
9. Rate-limit canary: 10 sequential failed logins, status codes logged
10. `/robots.txt` and `/.well-known/security.txt` presence (INFO)
11. TLS handshake on the site host (subject/issuer/dates printed as INFO)
12. Response headers: HSTS, X-Frame-Options/CSP frame-ancestors, CSP, X-Content-Type-Options, Referrer-Policy

Exits 0 only if every check is PASS or INFO. Exits 1 on any FAIL.

### Emulated flows (`tests/emulated/*.mjs`)

`browse-flow.mjs`
: Hits `/`, `/br`, `/br/seguidores`, a deep plan route, `/us/followers`,
  then `GET /v1/plans`, `/v1/categories`, `/v1/currencies`. Prints
  `PASS=8 FAIL=0` on a healthy production stack.

`checkout-flow.mjs`
: Fetches the live plans catalog, picks the smallest `seguidores`
  plan, and `POST /v1/checkout` with `payment_method=gateway` and a
  unique throwaway email (`smoke+<ts>@viralefy.test`). It does **not**
  pay — it just verifies the order-creation pipeline returns a
  `CheckoutResult` with an `order_id`. The pending order will be
  swept by the API's normal expiry logic.

## Failure interpretation

| Suite     | Hard failure means                                              |
| --------- | --------------------------------------------------------------- |
| unit      | Logic regression in i18n/SEO/format code. Block deploys.       |
| smoke     | A critical public route is broken or missing. Block deploys.   |
| pentest   | Security regression (e.g. admin endpoint open). Block deploys. |
| emulated  | API surface broke (plan listing / checkout creation). Block.   |

`INFO` rows are observations — currently flagged: missing CSP /
X-Frame-Options, missing `/robots.txt`, missing `/.well-known/security.txt`,
no `INDEXNOW_SECRET` enforcement on `/api/indexnow` in prod.

## Notes / trade-offs

- The unit suite imports real `.ts` files via a tiny module-customization
  hook (`tests/ts-loader-hooks.mjs`) that transpiles each `.ts` through
  the locally installed `typescript` compiler. Node 25's native
  `--experimental-strip-types` would normally do this for free, but it
  rejects a few constructs found in our source (e.g. `<Labels>{...}` in
  `src/i18n/countries.ts`). The hook keeps tests hermetic without
  needing to touch source files. No new packages were installed.
- `jsonld.test.mjs` and `search-corpus.test.mjs` mirror their target
  function inline because the real modules either use `"use client"` or
  pull in `next/server` / `lib/api` transitively. Drift is detectable
  but not auto-prevented — keep both sides in sync when editing.
- Pentest probes are deliberately conservative. For a real penetration
  test commission a separate exercise with an authorized scope.
