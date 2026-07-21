#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * O quê: sobe um stub HTTP da API do Viralefy servindo fixtures versionadas, pra
 *        que e2e e Lighthouse rodem sem depender da API de produção.
 * Onde:  usado pelos workflows `e2e.yml` e `lighthouse.yml` (e localmente via
 *        `npm run test:api-stub`); o build do Next aponta `NEXT_PUBLIC_API_URL`
 *        pra ele.
 * Fluxo: lê `tests/fixtures/*.json` → responde os GETs que o SSR e o client
 *        fazem ao montar as páginas públicas → o front renderiza catálogo real.
 * Entradas: env `PORT` (default 4010).
 * Saídas: processo servidor; imprime a porta ao subir.
 * Efeitos: abre socket TCP; não escreve nada.
 *
 * Por que existe: o e2e não definia `NEXT_PUBLIC_API_URL`, então o build caía no
 * default `localhost:8080` e as páginas de catálogo vinham VAZIAS — os testes
 * falhavam por falta de dado, não por bug. E o Lighthouse, apontado pra API de
 * produção, colhia erro de CORS no console (localhost não está na allowlist).
 * Com o stub, os dois rodam determinísticos e sem depender de prod estar no ar.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "tests", "fixtures");
const PORT = Number(process.env.PORT ?? 4010);

// Rota → arquivo de fixture. GET que não estiver aqui devolve `{"data":[]}`,
// que é o shape vazio que o front trata com degradação graciosa.
const ROUTES = new Map([
  ["/v1/plans", "plans.json"],
  ["/v1/currencies", "currencies.json"],
  ["/v1/country-ppp", "country-ppp.json"],
  ["/v1/tax-rates", "tax-rates.json"],
  ["/v1/status", "status.json"],
  ["/v1/categories", "categories.json"],
]);

// Rotas com parâmetro. O shape importa: `/reviews` devolve um OBJETO
// (`{aggregate, reviews}`), e não um array — devolver `[]` aqui fazia a página
// de plano estourar 500 em `reviews.length`.
const PATTERNS = [
  [/^\/v1\/plans\/[^/]+\/reviews$/, { data: { aggregate: null, reviews: [] } }],
  [/^\/v1\/plans\/[^/]+\/payment-methods$/, { data: [] }],
  [/^\/v1\/categories\/[^/]+\/reviews$/, { data: { aggregate: null } }],
  [/^\/v1\/ab\/assign$/, { data: {} }],
];

function body(pathname) {
  const file = ROUTES.get(pathname);
  if (file) {
    const full = join(FIXTURES, file);
    return existsSync(full) ? readFileSync(full, "utf8") : null;
  }
  for (const [re, payload] of PATTERNS) {
    if (re.test(pathname)) return JSON.stringify(payload);
  }
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  // CORS liberado: é um stub de teste em rede local, nunca vai pra runtime.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  const payload = body(url.pathname);
  res.writeHead(200).end(payload ?? JSON.stringify({ data: [] }));
}).listen(PORT, () => {
  process.stdout.write(`test-api-stub ouvindo em http://localhost:${PORT}\n`);
});
