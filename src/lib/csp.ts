// CSP nonce helper — round 25 Track CC.
//
// O middleware (`src/middleware.ts`) gera um nonce CSPRNG por request via
// `crypto.randomUUID()` e o propaga no header de request `x-nonce`. Next 15
// detecta esse header e injeta automaticamente `nonce={...}` nos scripts da
// framework (React runtime, bundles de page) e em `<Script>` do `next/script`
// que use a prop `nonce`.
//
// Para `<script>` puro (JSON-LD nas pages, anti-flash de tema no layout) o
// nonce NÃO é propagado automaticamente — é responsabilidade do server
// component ler o header e passar via prop. Este helper centraliza esse acesso
// pra evitar boilerplate de `(await headers()).get("x-nonce")` espalhado.
//
// Uso:
//   import { getNonce } from "@/lib/csp";
//   const nonce = await getNonce();
//   <script nonce={nonce} dangerouslySetInnerHTML={{...}} />
//
// Retorna `undefined` quando o header não está presente (ex.: rota fora do
// matcher do middleware, render estático sem request context). Nesse caso
// React simplesmente omite o atributo `nonce` no HTML — o que está OK para
// renderização estática (CSP é setada via header, não vai bater pra rotas
// que não passam pelo middleware).

import { headers } from "next/headers";

export async function getNonce(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-nonce") ?? undefined;
}
