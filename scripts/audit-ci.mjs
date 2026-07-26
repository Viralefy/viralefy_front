#!/usr/bin/env node
// Gate de auditoria de dependências para o CI.
//
// O quê: roda `npm audit` só nas dependências de PRODUÇÃO (o que de fato é
//        servido ao usuário) e falha se houver high/critical — exceto os
//        advisories na ALLOWLIST abaixo (aceitação de risco documentada).
// Onde:  chamado pelo job `npm-audit` do workflow CI, no lugar do
//        `npm audit --audit-level=high` cru.
// Por quê: o `npm audit` cru falhava por (a) advisories de FERRAMENTAS de dev
//        (storybook/lhci e suas cadeias webpack/glob/rimraf) que NUNCA são
//        servidas em produção — `--omit=dev` remove esse ruído; e (b) um
//        advisory do `next` sem fix estável e que não se aplica a nós — tratado
//        na allowlist. Assim o gate reflete risco REAL de runtime, não ruído.
//
// Saídas: exit 1 se sobrar high/critical não-allowlisted; 0 caso contrário.
// Efeitos: executa `npm audit` (rede); não escreve arquivos.

import { execSync } from "node:child_process";

// Allowlist: advisories high/critical de PRODUÇÃO aceitos conscientemente, com
// JUSTIFICATIVA. Chave = GHSA id (aparece na `url` do advisory). VAZIA hoje: os
// highs de prod foram todos consertados (next 15.5.21 + overrides de
// postcss/sharp/fast-uri/brace-expansion). O mecanismo fica pra quando aparecer
// um advisory sem fix e sabidamente inaplicável — aí entra aqui, documentado,
// em vez de afrouxar o gate inteiro. Reavaliar a cada bump de deps.
const ALLOWLIST = {};

function audit() {
  try {
    // --omit=dev: audita só o que vai pro runtime. `|| true` não serve porque
    // precisamos do JSON mesmo quando há vulns (npm audit sai != 0 nesse caso).
    return execSync("npm audit --omit=dev --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    // npm audit sai com código != 0 quando encontra vulns — o JSON vem no stdout.
    if (e.stdout) return e.stdout;
    throw e;
  }
}

const report = JSON.parse(audit());
const vulns = report.vulnerabilities ?? {};

const offenders = [];
for (const v of Object.values(vulns)) {
  if (v.severity !== "high" && v.severity !== "critical") continue;
  // Descobre os GHSA ids desse pacote (podem vir de múltiplos advisories via chain).
  const ghsas = (v.via ?? [])
    .filter((x) => typeof x === "object" && typeof x.url === "string")
    .map((x) => (x.url.match(/GHSA-[a-z0-9-]+/i) ?? [])[0])
    .filter(Boolean);
  // Allowlisted só se TODOS os advisories diretos do pacote estão na allowlist.
  const allAllowed = ghsas.length > 0 && ghsas.every((g) => ALLOWLIST[g]);
  if (allAllowed) {
    console.log(`  [allowlist] ${v.name} (${v.severity}) — ${ghsas.map((g) => ALLOWLIST[g]).join("; ")}`);
    continue;
  }
  offenders.push({ name: v.name, severity: v.severity, ghsas });
}

const m = report.metadata?.vulnerabilities ?? {};
console.log(`\nprod audit: ${m.critical ?? 0} critical, ${m.high ?? 0} high, ${m.moderate ?? 0} moderate, ${m.low ?? 0} low`);

if (offenders.length > 0) {
  console.error(`\n✗ ${offenders.length} high/critical em produção NÃO-allowlisted:`);
  for (const o of offenders) console.error(`   - ${o.name} (${o.severity}) ${o.ghsas.join(",")}`);
  console.error("\nConserte (bump/override) ou, se for aceitação de risco justificada, adicione à ALLOWLIST em scripts/audit-ci.mjs.");
  process.exit(1);
}

console.log("\n✓ nenhum high/critical de produção fora da allowlist.");
