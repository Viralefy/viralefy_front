// Endpoint server-side para disparar IndexNow.
//
//   POST /api/indexnow
//   Body: { urls?: string[] }
//
// Se `urls` vier vazio, regenera a lista a partir das URLs canônicas do
// sitemap (home, países, países × categorias, países × categoria × planos,
// legais).
//
// Header `x-indexnow-secret` precisa bater com `INDEXNOW_SECRET` (default
// vazio = aceita qualquer um). Para uso de produção definir o segredo.

import { NextResponse } from "next/server";
import { envIndexNow, keyLocation, submitToIndexNow } from "@/lib/indexnow";
import { allSiteUrls } from "@/lib/site-urls";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.INDEXNOW_SECRET;
  if (secret && req.headers.get("x-indexnow-secret") !== secret) {
    return NextResponse.json({ error: { code: "forbidden", message: "Bad secret" } }, { status: 403 });
  }

  let body: { urls?: string[] } = {};
  try {
    body = (await req.json()) as { urls?: string[] };
  } catch {
    body = {};
  }

  let urls = body.urls;
  if (!urls || urls.length === 0) {
    const list = await allSiteUrls();
    urls = list.map((u) => u.url);
  }

  const { key, host } = envIndexNow();
  const result = await submitToIndexNow({
    host,
    key,
    keyLocation: keyLocation(),
    urlList: urls,
  });

  return NextResponse.json({
    data: {
      submitted: urls.length,
      ok: result.ok,
      status: result.status,
      keyLocation: keyLocation(),
      indexnowBody: result.body || undefined,
    },
  });
}

export async function GET() {
  // Útil pra checagem ad-hoc — devolve quantas URLs o site canonicaliza.
  const list = await allSiteUrls();
  return NextResponse.json({
    data: {
      count: list.length,
      sample: list.slice(0, 10).map((u) => u.url),
      keyLocation: keyLocation(),
    },
  });
}
