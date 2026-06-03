// Regression guard: scan the production source for hardcoded "R$" or
// pt-BR locale arguments OUTSIDE the legitimate copy/locale i18n files.
//
// Política: visitante global vê USDT/$ por default; "R$" só aparece quando
// a moeda escolhida é BRL ou o usuário está no mercado BR. pt-BR locale só
// quando o usuário está em BR. Qualquer hardcode em código de UI/lógica é
// regressão.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../src/", import.meta.url).pathname;

// Arquivos onde "R$" / "pt-BR" são INTENCIONAIS (copy localizada de BR/PT,
// legal templates traduzidos, mapas país→moeda, etc.).
const ALLOWED_PATHS = [
  /\/i18n\/legal\.ts$/,         // legal text translated per language
  /\/i18n\/countries\.ts$/,     // country labels (BR htmlLang etc.)
  /\/i18n\/categories\.ts$/,    // category copy in pt
  /\/i18n\/languages\.ts$/,     // pt language fixtures
  /\/lib\/geo-currency\.ts$/,   // country→currency MAP (br:"BRL" é mapping, não default)
  /\/lib\/format\.ts$/,         // contém comentário explicando o leak histórico
  /\/components\/Providers\.tsx$/, // comentário com referência histórica
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(p)) files.push(p);
  }
  return files;
}

function isAllowed(file) {
  return ALLOWED_PATHS.some((re) => re.test(file));
}

function lineNumberOf(content, idx) {
  return content.slice(0, idx).split("\n").length;
}

const files = walk(ROOT);

test("no hardcoded 'R$' literal in UI files outside i18n copy", () => {
  const leaks = [];
  for (const f of files) {
    if (isAllowed(f)) continue;
    const src = readFileSync(f, "utf8");
    // Procura por R$ em string literals reais (entre aspas ou template).
    // Aceita strings JSX como "Balance: R$ ..." ou template `R$ ${x}`.
    const re = /R\$/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = lineNumberOf(src, m.index);
      const lineStr = src.split("\n")[line - 1] ?? "";
      // Pula linhas que são comentários (//) — comentários internos do dev
      // team podem citar BRL/R$ sem virar UI.
      if (/^\s*\/\//.test(lineStr) || /^\s*\*/.test(lineStr)) continue;
      leaks.push(`${relative(ROOT, f)}:${line} → ${lineStr.trim().slice(0, 100)}`);
    }
  }
  assert.equal(
    leaks.length,
    0,
    `BRL/R$ leaks found:\n${leaks.join("\n")}`,
  );
});

test("no toLocaleString(\"pt-BR\") or similar pt-BR locale call in UI files", () => {
  const leaks = [];
  for (const f of files) {
    if (isAllowed(f)) continue;
    const src = readFileSync(f, "utf8");
    // toLocaleString("pt-BR"), toLocaleDateString("pt-BR"), etc.
    const re = /toLocale(?:String|DateString|TimeString)\(\s*["']pt-BR["']/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = lineNumberOf(src, m.index);
      leaks.push(`${relative(ROOT, f)}:${line}`);
    }
  }
  assert.equal(
    leaks.length,
    0,
    `pt-BR locale calls found (use toLocaleString() without args, or "en-US"):\n${leaks.join("\n")}`,
  );
});

test("no <html lang=\"pt-BR\"> in the front root layout (admin policy: EN default)", () => {
  // Front-side: home is global English; per-country routes set their own.
  const layouts = files.filter((f) => /\/app\/layout\.tsx$/.test(f));
  for (const f of layouts) {
    const src = readFileSync(f, "utf8");
    assert.ok(
      !/lang=["']pt-BR["']/.test(src),
      `${relative(ROOT, f)} hardcodes <html lang="pt-BR"> — layout must default to EN`,
    );
  }
});

test("home page meta description does NOT advertise BRL as a payment currency", () => {
  // Regressão: a home global anunciava "Pay in USDT, USD, EUR, BRL or crypto."
  // BRL não pode entrar na meta description global.
  const homes = files.filter((f) => /\/app\/page\.tsx$/.test(f));
  for (const f of homes) {
    const src = readFileSync(f, "utf8");
    assert.ok(
      !/Pay in[^"]*BRL/i.test(src),
      `${relative(ROOT, f)} advertises BRL in meta description`,
    );
  }
});
