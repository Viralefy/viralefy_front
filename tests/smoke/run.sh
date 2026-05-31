#!/usr/bin/env bash
# Smoke tests for the Viralefy production front-end.
#
# Strategy: curl every critical URL, assert 200 + minimal body shape +
# presence of expected content (titles, hreflang count, JSON-LD, GTM,
# sitemap size, IndexNow keyfile). Print a PASS/FAIL row per check
# and exit 0 only if every required check passes. Optional checks
# (country routes that may not be deployed yet) are flagged as INFO.
#
# Tunables via env:
#   SITE_URL       — base URL (default https://viralefy.com)
#   SMOKE_TIMEOUT  — per-request timeout in seconds (default 15)
#   SMOKE_VERBOSE  — set to 1 to dump curl bodies on failure

set -u

SITE_URL="${SITE_URL:-https://viralefy.com}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"
VERBOSE="${SMOKE_VERBOSE:-0}"

pass=0
fail=0
info=0

green="\033[32m"
red="\033[31m"
yellow="\033[33m"
gray="\033[90m"
reset="\033[0m"

mark_pass() { pass=$((pass + 1));  printf "  ${green}PASS${reset} %s\n" "$1"; }
mark_fail() { fail=$((fail + 1));  printf "  ${red}FAIL${reset} %s — %s\n" "$1" "$2"; }
mark_info() { info=$((info + 1));  printf "  ${yellow}INFO${reset} %s — %s\n" "$1" "$2"; }
note()      { printf "${gray}        %s${reset}\n" "$1"; }

fetch() {
  # $1 = path
  # writes status, size, body to globals
  local path="$1"
  local tmp
  tmp="$(mktemp)"
  local code
  code=$(curl -sS -o "$tmp" -w "%{http_code}" \
      --max-time "$TIMEOUT" \
      -A "Viralefy-Smoke/1.0" \
      "${SITE_URL}${path}" 2>/dev/null || echo "000")
  RESP_STATUS="$code"
  RESP_BODY_FILE="$tmp"
  RESP_SIZE=$(wc -c < "$tmp")
}

require_status_200_min_size() {
  local label="$1" path="$2" min_size="$3"
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -ge "$min_size" ]; then
    mark_pass "$label"
  else
    mark_fail "$label" "status=$RESP_STATUS size=$RESP_SIZE want >=200/$min_size at $path"
    [ "$VERBOSE" = "1" ] && head -c 500 "$RESP_BODY_FILE"
  fi
  rm -f "$RESP_BODY_FILE"
}

require_contains() {
  local label="$1" path="$2" needle="$3"
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && grep -q -- "$needle" "$RESP_BODY_FILE"; then
    mark_pass "$label"
  else
    mark_fail "$label" "status=$RESP_STATUS needle '$needle' not in $path"
    [ "$VERBOSE" = "1" ] && head -c 500 "$RESP_BODY_FILE"
  fi
  rm -f "$RESP_BODY_FILE"
}

info_if_missing() {
  local label="$1" path="$2"
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -ge 200 ]; then
    mark_pass "$label"
  else
    mark_info "$label" "status=$RESP_STATUS path $path (optional)"
  fi
  rm -f "$RESP_BODY_FILE"
}

printf "\n${gray}Viralefy smoke run against %s${reset}\n\n" "$SITE_URL"

# ------------------------------------------------------------------
# Section: core routes
# ------------------------------------------------------------------
printf "[core routes]\n"
require_status_200_min_size "GET /" "/" 500
require_contains "GET / contains 'Viralefy'" "/" "Viralefy"
require_status_200_min_size "GET /br" "/br" 500
require_contains "GET /br has heroTitle Portuguese" "/br" "Instagram"

# ------------------------------------------------------------------
# Section: per-country subsites (these may not all be deployed yet)
# ------------------------------------------------------------------
printf "\n[country subsites]\n"
info_if_missing "GET /us"  "/us"
info_if_missing "GET /fr"  "/fr"
info_if_missing "GET /de"  "/de"
info_if_missing "GET /it"  "/it"
info_if_missing "GET /es"  "/es"
info_if_missing "GET /pt"  "/pt"
info_if_missing "GET /ar"  "/ar"
info_if_missing "GET /mx"  "/mx"

# ------------------------------------------------------------------
# Section: country/category routes
# ------------------------------------------------------------------
printf "\n[country/category routes]\n"
info_if_missing "GET /br/seguidores"  "/br/seguidores"
info_if_missing "GET /us/followers"   "/us/followers"
info_if_missing "GET /fr/abonnes"     "/fr/abonnes"
info_if_missing "GET /de/follower"    "/de/follower"
info_if_missing "GET /it/follower"    "/it/follower"
info_if_missing "GET /es/seguidores"  "/es/seguidores"
info_if_missing "GET /br/servicos"    "/br/servicos"

# ------------------------------------------------------------------
# Section: country/category/plan routes
# ------------------------------------------------------------------
printf "\n[deep plan routes]\n"
info_if_missing "GET /br/seguidores/1000-seguidores"     "/br/seguidores/1000-seguidores"
info_if_missing "GET /us/followers/10000-followers"      "/us/followers/10000-followers"

# ------------------------------------------------------------------
# Section: legal documents
# ------------------------------------------------------------------
printf "\n[legal docs]\n"
require_status_200_min_size "GET /legal/privacy?lang=pt" "/legal/privacy?lang=pt" 400
require_status_200_min_size "GET /legal/terms?lang=en"   "/legal/terms?lang=en"   400
info_if_missing "GET /legal/refund?lang=de"             "/legal/refund?lang=de"

# ------------------------------------------------------------------
# Section: hreflang count on home
# ------------------------------------------------------------------
printf "\n[hreflang]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  hreflang_count=$(grep -o 'hreflang=' "$RESP_BODY_FILE" | wc -l)
  if [ "$hreflang_count" -ge 5 ]; then
    mark_pass "hreflang count on /: $hreflang_count (>=5)"
  else
    mark_info "hreflang count on /: $hreflang_count (<5, may not be wired yet)" "$hreflang_count"
  fi
else
  mark_fail "hreflang count on /" "could not fetch /"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: JSON-LD presence
# ------------------------------------------------------------------
printf "\n[JSON-LD]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -q 'application/ld+json' "$RESP_BODY_FILE"; then
    mark_pass "/ contains application/ld+json"
  else
    mark_info "/ JSON-LD" "no <script type=application/ld+json> found on /"
  fi
else
  mark_fail "/ JSON-LD" "/ not reachable"
fi
rm -f "$RESP_BODY_FILE"

fetch "/br"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -q 'application/ld+json' "$RESP_BODY_FILE"; then
    mark_pass "/br contains application/ld+json"
  else
    mark_info "/br JSON-LD" "no <script type=application/ld+json> found on /br"
  fi
else
  mark_info "/br JSON-LD" "/br not reachable (subsite may be lazy)"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: Google Tag Manager
# ------------------------------------------------------------------
printf "\n[analytics]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -qE '(googletagmanager\.com|gtag\(|GTM-)' "$RESP_BODY_FILE"; then
    mark_pass "/ ships GTM/gtag tag"
  else
    mark_info "/ GTM" "no GTM tag detected (may be conditional on env)"
  fi
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: sitemap
# ------------------------------------------------------------------
printf "\n[sitemap]\n"
fetch "/sitemap.xml"
if [ "$RESP_STATUS" = "200" ]; then
  if head -c 200 "$RESP_BODY_FILE" | grep -q '<?xml'; then
    mark_pass "/sitemap.xml is XML"
  else
    mark_fail "/sitemap.xml is XML" "missing <?xml prolog"
  fi
  url_count=$(grep -c '<loc>' "$RESP_BODY_FILE")
  if [ "$url_count" -ge 200 ]; then
    mark_pass "/sitemap.xml has >=200 URLs ($url_count)"
  else
    mark_info "/sitemap.xml URL count: $url_count" "expected lots more once API plans seed in"
  fi
else
  mark_fail "/sitemap.xml" "status=$RESP_STATUS"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: IndexNow key file
# ------------------------------------------------------------------
printf "\n[indexnow]\n"
INDEXNOW_KEY_FILENAME="adcfcb87889076210f395f754a9ad0c3.txt"
fetch "/${INDEXNOW_KEY_FILENAME}"
if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -gt 10 ]; then
  mark_pass "/${INDEXNOW_KEY_FILENAME} served (size=$RESP_SIZE)"
else
  mark_fail "/${INDEXNOW_KEY_FILENAME}" "status=$RESP_STATUS size=$RESP_SIZE"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: robots.txt (informational)
# ------------------------------------------------------------------
printf "\n[robots]\n"
fetch "/robots.txt"
if [ "$RESP_STATUS" = "200" ]; then
  mark_pass "/robots.txt served"
else
  mark_info "/robots.txt" "status=$RESP_STATUS (optional)"
fi
rm -f "$RESP_BODY_FILE"

# ==================================================================
# NEW SECTIONS (theme switcher, sitemap split, twemoji, ru countries,
# DB plan translation, hreflang sanity, JSON-LD presence on /br/<cat>)
# ==================================================================

# ------------------------------------------------------------------
# Section: sitemap index / per-language split
# ------------------------------------------------------------------
printf "\n[sitemap split]\n"
fetch "/sitemap.xml"
if [ "$RESP_STATUS" = "200" ]; then
  # Is it a sitemapindex (split mode) or a single urlset?
  if grep -q '<sitemapindex' "$RESP_BODY_FILE"; then
    sitemap_count=$(grep -c '<sitemap>' "$RESP_BODY_FILE")
    if [ "$sitemap_count" -ge 2 ]; then
      mark_pass "/sitemap.xml is a sitemapindex with $sitemap_count <sitemap> entries"
    else
      mark_info "/sitemap.xml is a sitemapindex but only $sitemap_count entries" "expect more once split is wired"
    fi
  else
    # Fallback: single urlset must have many URLs
    url_count=$(grep -c '<loc>' "$RESP_BODY_FILE")
    if [ "$url_count" -ge 200 ]; then
      mark_pass "/sitemap.xml is single urlset with $url_count URLs (split pending)"
    else
      mark_info "/sitemap.xml urlset only $url_count URLs" "split + seeding pending"
    fi
  fi
else
  mark_info "/sitemap.xml split check" "status=$RESP_STATUS"
fi
rm -f "$RESP_BODY_FILE"

# Per-language sitemap candidates (two naming conventions): informational.
for path in "/sitemap-en.xml" "/sitemap/en.xml" "/sitemap-pt.xml" "/sitemap/pt.xml"; do
  fetch "$path"
  if [ "$RESP_STATUS" = "200" ] && head -c 200 "$RESP_BODY_FILE" | grep -q '<?xml'; then
    mark_pass "GET $path exists as XML"
  else
    mark_info "GET $path" "status=$RESP_STATUS (per-lang sitemap pending)"
  fi
  rm -f "$RESP_BODY_FILE"
done

# ------------------------------------------------------------------
# Section: robots.txt richer assertions
# ------------------------------------------------------------------
printf "\n[robots richer]\n"
fetch "/robots.txt"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -qi "sitemap:" "$RESP_BODY_FILE"; then
    mark_pass "/robots.txt mentions Sitemap:"
  else
    mark_info "/robots.txt Sitemap directive" "missing"
  fi
  if grep -qi "disallow:" "$RESP_BODY_FILE"; then
    mark_pass "/robots.txt has at least one Disallow directive"
  else
    mark_info "/robots.txt Disallow" "no Disallow lines"
  fi
else
  mark_info "/robots.txt" "not served — skipping content check"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: theme switcher hint on /
# ------------------------------------------------------------------
printf "\n[theme switcher]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -q 'data-theme' "$RESP_BODY_FILE"; then
    mark_pass "/ contains data-theme attribute (theme switcher wired)"
  else
    mark_info "/ data-theme" "not present (theme switcher pending deploy)"
  fi
else
  mark_info "/ data-theme" "/ not reachable"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: emoji rendering hint (twemoji or system emoji CSS)
# ------------------------------------------------------------------
printf "\n[emoji rendering]\n"
fetch "/"
if [ "$RESP_STATUS" = "200" ]; then
  if grep -qE '(twemoji|"Apple Color Emoji"|emoji)' "$RESP_BODY_FILE"; then
    mark_pass "/ ships twemoji or emoji font hint"
  else
    mark_info "/ emoji hint" "no twemoji/emoji marker (flags may render poorly)"
  fi
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: Russian-speaking country routes (ru, kz, by, kg)
# ------------------------------------------------------------------
printf "\n[ru countries]\n"
for c in "ru" "kz" "by" "kg"; do
  fetch "/$c"
  if [ "$RESP_STATUS" = "200" ] && [ "$RESP_SIZE" -ge 500 ]; then
    mark_pass "GET /$c (Russian-speaking country) served"
  elif [ "$RESP_STATUS" = "404" ]; then
    mark_info "GET /$c -> 404" "country not yet in COUNTRIES catalog"
  else
    mark_info "GET /$c -> $RESP_STATUS" "informational"
  fi
  rm -f "$RESP_BODY_FILE"
done

# ------------------------------------------------------------------
# Section: DB plan translation — Account recovery on /br/servicos
# ------------------------------------------------------------------
printf "\n[plan name translation]\n"
fetch "/br/servicos"
if [ "$RESP_STATUS" = "200" ]; then
  # The expected PT-translated name is "Recuperação de conta" but legacy
  # English "Account recovery" might still appear before the DB seed runs.
  if grep -qiE "(Recupera..o de conta|Account recovery|Recuperação)" "$RESP_BODY_FILE"; then
    mark_pass "/br/servicos lists the account recovery plan"
  else
    mark_info "/br/servicos account-recovery plan" "neither PT nor EN name found"
  fi
else
  mark_info "/br/servicos plan check" "status=$RESP_STATUS"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Section: hreflang strict sanity on /br
# ------------------------------------------------------------------
printf "\n[hreflang strict]\n"
fetch "/br"
if [ "$RESP_STATUS" = "200" ]; then
  hreflang_count=$(grep -oE 'hreflang=' "$RESP_BODY_FILE" | wc -l)
  # We expect >= 60 with 126 countries in /br metadata (Next emits alternates
  # for the whole catalog). Tolerant: PASS at 30+, INFO below.
  if [ "$hreflang_count" -ge 30 ]; then
    mark_pass "/br hreflang count: $hreflang_count (>=30)"
  else
    mark_info "/br hreflang count: $hreflang_count" "<30, alternates may not be wired on country pages"
  fi
  # x-default presence
  if grep -q 'x-default' "$RESP_BODY_FILE"; then
    mark_pass "/br includes hreflang x-default"
  else
    mark_info "/br x-default" "not found"
  fi
else
  mark_info "/br hreflang strict" "status=$RESP_STATUS"
fi
rm -f "$RESP_BODY_FILE"

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
total=$((pass + fail + info))
printf "\n${gray}=================================================${reset}\n"
printf "${green}PASS%s${reset}   ${red}FAIL%s${reset}   ${yellow}INFO%s${reset}   ${gray}TOTAL%s${reset}\n" \
  "=$pass" "=$fail" "=$info" "=$total"

if [ "$fail" -gt 0 ]; then
  exit 1
fi
exit 0
