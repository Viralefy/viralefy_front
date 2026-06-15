// security.test.mjs — frontослов security guился.
// Cobre:
//   - dangerouslySetInnerHTML só com JSON.stringify (JSON-LD), nunca
//     com texto user-controlled
//   - Tokens nunca logados em console
//   - Tokens nunca embutidos em URL fragments
//   - localStorage["viralefy_session"] tem expiração validada
//   - CSP em next.config.ts é explícita — nenhuma diretiva default-src
//     ausente, frame-ancestors 'none', upgrade-insecure-requests presente

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = new URL("../../src/", import.meta.url).pathname;
const ROOT = new URL("../../", import.meta.url).pathname;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|mjs|js)$/.test(p)) files.push(p);
  }
  return files;
}

const srcFiles = walk(SRC);

test("dangerouslySetInnerHTML only feeds JSON.stringify or known-safe constant", () => {
  // Política: o único uso permitido é JSON-LD (<script type="application/ld+json">)
  // alimentado por JSON.stringify(...), ou o ANTI_FLASH_THEME constant
  // (script de tema inline, conteúdo controlado pelo dev). Texto vindo
  // de user input NUNCA pode passar pra dangerouslySetInnerHTML.
  const violations = [];
  for (const f of srcFiles) {
    const src = readFileSync(f, "utf8");
    const re = /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*([^}]+)\}\s*\}/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const expr = m[1].trim();
      // safeJsonStringify (lib/jsonld.ts) é o wrapper canônico da casa:
      // escapa </script>, U+2028, U+2029 etc. antes de delegar pra JSON.stringify.
      // Toda injeção de JSON-LD passa por ele.
      const isJsonLd =
        /JSON\.stringify\s*\(/.test(expr) || /safeJsonStringify\s*\(/.test(expr);
      const isKnownConst =
        expr === "ANTI_FLASH_THEME" ||
        /^[A-Z_][A-Z0-9_]*$/.test(expr); // SCREAMING_SNAKE_CASE constants
      if (!isJsonLd && !isKnownConst) {
        const line = src.slice(0, m.index).split("\n").length;
        violations.push(`${relative(ROOT, f)}:${line} → ${expr.slice(0, 80)}`);
      }
    }
  }
  assert.equal(
    violations.length,
    0,
    `unsafe dangerouslySetInnerHTML expressions:\n${violations.join("\n")}`,
  );
});

test("no token/session value logged via console.* in source", () => {
  // Cheirinho de "console.log(token)" / "console.log(session)" é um
  // smell clássico de vazamento. Pode passar em dev e quebrar
  // confidencialidade em prod (logs do navegador são mantidos por
  // outras extensões / RUM SDKs).
  const leaks = [];
  for (const f of srcFiles) {
    const src = readFileSync(f, "utf8");
    const re = /console\.(log|info|warn|debug|trace)\s*\([^)]*\b(token|session|jwt|password|api_?key)\b/gi;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split("\n").length;
      leaks.push(`${relative(ROOT, f)}:${line}`);
    }
  }
  assert.equal(
    leaks.length,
    0,
    `console.* leaking auth material:\n${leaks.join("\n")}`,
  );
});

test("no token embedded in URL fragments or query strings (location/router)", () => {
  // Smell: window.location.hash = `token=${tok}` ou
  // router.push(`/foo?token=${tok}`). Tokens em URLs vazam via Referer,
  // browser history, server logs do destino.
  const leaks = [];
  for (const f of srcFiles) {
    const src = readFileSync(f, "utf8");
    // pattern: `?token=` ou `#token=` ou `?jwt=` em template literal/string.
    const re = /[?#]\s*(token|jwt|api_?key|session)\s*=/gi;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split("\n").length;
      const lineStr = src.split("\n")[line - 1] ?? "";
      // Pula linhas de comentário.
      if (/^\s*\/\//.test(lineStr) || /^\s*\*/.test(lineStr)) continue;
      // Pula matches em URLSearchParams.get("token") — só consumo, não envio.
      if (/\.get\s*\(\s*["'](token|jwt|api_?key|session)["']/i.test(lineStr)) continue;
      leaks.push(`${relative(ROOT, f)}:${line} → ${lineStr.trim().slice(0, 100)}`);
    }
  }
  assert.equal(
    leaks.length,
    0,
    `tokens embedded in URL:\n${leaks.join("\n")}`,
  );
});

test("viralefy_session storage has expiration validation if present", () => {
  // Procura usos de localStorage["viralefy_session"] ou similar. Se
  // existir, deve haver validação de expiração próxima (expires_at, exp,
  // ttl, Date.now()). Senão, sessão eterna é um anti-pattern.
  const sessionUsers = [];
  for (const f of srcFiles) {
    const src = readFileSync(f, "utf8");
    if (/viralefy_session|VIRALEFY_SESSION/.test(src)) {
      sessionUsers.push({ f, src });
    }
  }
  if (sessionUsers.length === 0) {
    // Sem uso da chave — nada a validar. Estado válido (token ainda não
    // foi armazenado em localStorage; é só httpOnly cookie por enquanto).
    return;
  }
  for (const { f, src } of sessionUsers) {
    const hasExpCheck =
      /expires?_?at|exp[^a-z]|Date\.now|ttl/.test(src);
    assert.ok(
      hasExpCheck,
      `${relative(ROOT, f)} uses viralefy_session but has no expiration validation (eternal session smell)`,
    );
  }
});

test("CSP in middleware.ts includes critical directives", () => {
  // Round 25 Track CC: CSP foi MOVIDA de next.config.ts pro middleware (gera
  // nonce per-request via crypto.randomUUID). Auditoria estrutural agora roda
  // contra o `buildCsp()` do middleware.
  //
  // Pisos checados:
  //   - default-src 'self'  (whitelist por padrão)
  //   - frame-ancestors 'none'  (clickjacking)
  //   - object-src 'none'  (Flash/legacy attack surface)
  //   - base-uri 'self'  (base tag hijack)
  //   - form-action 'self'  (form CSRF redirection)
  //   - upgrade-insecure-requests  (HTTPS-only)
  const mw = readFileSync(join(SRC, "middleware.ts"), "utf8");
  // Captura o array de directives do buildCsp.
  const m = mw.match(/function buildCsp[\s\S]*?const directives\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(m, "buildCsp() directives array not found in middleware.ts");
  const cspBody = m[1];
  const required = [
    "default-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];
  for (const directive of required) {
    assert.ok(
      cspBody.includes(directive),
      `CSP missing required directive: ${directive}`,
    );
  }
});

test("CSP script-src uses nonce + strict-dynamic, no 'unsafe-inline'", () => {
  // Round 25 Track CC: o front passou a emitir CSP com nonce per-request +
  // 'strict-dynamic'. 'unsafe-inline' em script-src virou regressão e este
  // teste falha se reintroduzido. style-src ainda usa 'unsafe-inline' (débito
  // conhecido do Next 15 — sem propagação confiável de nonce em CSS modules
  // dev, next/font, runtime style insertion). Backoffice tem o mesmo trade-off.
  const mw = readFileSync(join(SRC, "middleware.ts"), "utf8");
  const scriptSrcMatch = mw.match(/`script-src[^`]+`/);
  assert.ok(scriptSrcMatch, "script-src directive not found in middleware.ts buildCsp()");
  const scriptSrc = scriptSrcMatch[0];
  assert.ok(
    scriptSrc.includes("'nonce-${nonce}'"),
    "script-src must include nonce-${nonce} (per-request CSPRNG)",
  );
  assert.ok(
    scriptSrc.includes("'strict-dynamic'"),
    "script-src must include 'strict-dynamic' (round 25 Track CC)",
  );
  assert.ok(
    !/script-src[^`]*'unsafe-inline'/.test(scriptSrc),
    "script-src MUST NOT include 'unsafe-inline' — round 25 eliminated it via nonce + strict-dynamic",
  );
});

test("strict security headers present in next.config.ts", () => {
  // X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  // Permissions-Policy — defesas em camadas além do CSP.
  const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf8");
  const required = [
    /X-Frame-Options[\s\S]*?DENY/,
    /X-Content-Type-Options[\s\S]*?nosniff/,
    /Referrer-Policy[\s\S]*?strict-origin-when-cross-origin/,
    /Permissions-Policy/,
  ];
  for (const re of required) {
    assert.match(cfg, re, `missing security header matching ${re}`);
  }
});
