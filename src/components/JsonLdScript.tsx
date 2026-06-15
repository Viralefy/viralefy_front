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
import { getNonce } from "@/lib/csp";

export async function JsonLdScript({ data }: { data: unknown }) {
  const nonce = await getNonce();
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(data) }}
    />
  );
}
