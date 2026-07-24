// JsonLdScript — server component que emite `<script type="application/ld+json">`
// já com `nonce` lido do header `x-nonce` (setado pelo middleware no round 25
// Track CC). Centraliza a injeção de JSON-LD pra evitar repetir o pattern
// `const nonce = await getNonce(); <script nonce={nonce} ... />` em cada page.
//
// Uso (server component):
//   import { JsonLdScript } from "@/components/JsonLdScript";
//   <JsonLdScript data={jsonld} />
//
// Uso (a partir de client component, ex.: cookie-preferences):
//   o componente é server-only — basta importar e renderizar dentro do JSX
//   client; o Next 15 trata isso como server boundary (client compõe server
//   components que recebem props serializáveis).
//
// O JSON é serializado via `safeJsonStringify` que escapa `</script>`, U+2028,
// U+2029 etc. (ver `@/lib/jsonld`) — convenção da casa pra injeção segura.

import { safeJsonStringify } from "@/lib/jsonld";

// `type="application/ld+json"` é DADO, não script executável — a CSP
// `script-src` não se aplica a ele, então NÃO precisa de nonce/hash. Antes
// carregava um nonce per-request (`getNonce`), o que obrigava a página a ler
// `headers()` e virava render dinâmico. Sem nonce, o componente é síncrono e
// não toca o request context — pré-renderizável (ISR). Ver `@/lib/theme-bootstrap`
// e o middleware pra a CSP estática.
export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(data) }}
    />
  );
}
