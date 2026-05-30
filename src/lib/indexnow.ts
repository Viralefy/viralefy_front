// Cliente IndexNow (Bing / Yandex) — submete URLs em lote para indexação
// instantânea. Cada host precisa hospedar um `{key}.txt` na raiz com a
// mesma chave, pra IndexNow validar a posse do domínio.
//
// IndexNow é o protocolo aberto que o Bing absorveu. URL canônica:
// https://api.indexnow.org/indexnow (ou variants em https://www.bing.com/indexnow).
// Usamos o endpoint do bing pra evitar caches intermediários.
//
// Modo de uso:
//   - dispara automaticamente ao mudar plano/categoria (chamada server-side
//     do backend — o handler em /api/indexnow/ping recebe a lista e
//     reencaminha pro IndexNow);
//   - opcional: script CLI `npm run indexnow:resubmit` que regenera o sitemap
//     e submete tudo de uma vez.
//
// O segredo `INDEXNOW_KEY` precisa bater com o nome do arquivo em /public.

const INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";

export type IndexNowPayload = {
  host: string;             // ex.: "viralefy.com"
  key: string;              // hex de 16+ chars
  keyLocation: string;      // URL pública do `{key}.txt`
  urlList: string[];        // até 10000 URLs por chamada
};

export async function submitToIndexNow(payload: IndexNowPayload): Promise<{ ok: boolean; status: number; body?: string }> {
  if (payload.urlList.length === 0) return { ok: true, status: 200 };
  // O IndexNow exige no máximo 10k URLs por chamada. Quebramos em chunks.
  const CHUNK = 10000;
  let lastOk = true;
  let lastStatus = 0;
  let lastBody = "";
  for (let i = 0; i < payload.urlList.length; i += CHUNK) {
    const chunk = payload.urlList.slice(i, i + CHUNK);
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ...payload, urlList: chunk }),
    });
    lastStatus = res.status;
    lastOk = lastOk && res.ok;
    if (!res.ok) {
      lastBody = await res.text().catch(() => "");
      break;
    }
  }
  return { ok: lastOk, status: lastStatus, body: lastBody };
}

// Pega a key+host do ambiente. Default casa com o `{key}.txt` em /public.
export function envIndexNow(): { key: string; host: string; siteUrl: string } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const host = new URL(siteUrl).host;
  const key = process.env.INDEXNOW_KEY ?? "adcfcb87889076210f395f754a9ad0c3";
  return { key, host, siteUrl };
}

export function keyLocation(): string {
  const { siteUrl, key } = envIndexNow();
  return `${siteUrl}/${key}.txt`;
}
