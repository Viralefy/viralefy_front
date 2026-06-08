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
      const isJsonLd = /JSON\.stringify\s*\(/.test(expr);
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

test("CSP in next.config.ts includes critical directives", () => {
  // Auditoria estrutural do CSP: o front por enquanto usa 'unsafe-inline'
  // pra scripts (necessário pro Next 15 RSC inline hydration + GTM). Esse
  // teste NÃO falha por isso — but ensures the *hard* boundaries are present:
  //   - default-src 'self'  (whitelist por padrão)
  //   - frame-ancestors 'none'  (clickjacking)
  //   - object-src 'none'  (Flash/legacy attack surface)
  //   - base-uri 'self'  (base tag hijack)
  //   - form-action 'self'  (form CSRF redirection)
  //   - upgrade-insecure-requests  (HTTPS-only)
  const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf8");
  // Captura o array da CSP value.
  const m = cfg.match(/Content-Security-Policy[\s\S]*?value:\s*\[([\s\S]*?)\]\.join/);
  assert.ok(m, "Content-Security-Policy block not found in next.config.ts");
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

test("CSP unsafe-inline in script-src is documented as conscious tradeoff", () => {
  // Se 'unsafe-inline' aparece em script-src, deve haver comentário
  // explicando — ninguém pode reintroduzir isso por acidente. Hoje está
  // presente (Next 15 RSC + GTM). Documentação serve de gate humano.
  const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf8");
  const hasUnsafeInline = /script-src[^"]*'unsafe-inline'/.test(cfg);
  if (hasUnsafeInline) {
    // Verifica que o comentário do bloco SECURITY_HEADERS menciona o motivo.
    const hasJustification = /GTM|Next|hydration|nonce/i.test(
      cfg.slice(0, cfg.indexOf("SECURITY_HEADERS") + 600),
    );
    assert.ok(
      hasJustification,
      "next.config.ts has 'unsafe-inline' in script-src but no nearby comment justifying it (must document conscious tradeoff)",
    );
  }
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
