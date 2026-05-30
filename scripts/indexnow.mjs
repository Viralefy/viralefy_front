#!/usr/bin/env node
// scripts/indexnow.mjs — script CLI que chama o endpoint /api/indexnow
// para submeter todas as URLs do site ao Bing/IndexNow.
//
// Uso:
//   SITE_URL=https://viralefy.com INDEXNOW_SECRET=... node scripts/indexnow.mjs
//
// Funciona contra qualquer instância do Next.js já rodando (dev ou prod).

const SITE = process.env.SITE_URL ?? "http://localhost:3000";
const SECRET = process.env.INDEXNOW_SECRET ?? "";

async function main() {
  const headers = { "Content-Type": "application/json" };
  if (SECRET) headers["x-indexnow-secret"] = SECRET;
  const res = await fetch(`${SITE}/api/indexnow`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const json = await res.json().catch(() => ({}));
  console.log(JSON.stringify(json, null, 2));
  if (!res.ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
