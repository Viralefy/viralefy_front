// Open Graph dinâmico: GET /og/{country}/{category}[/{plan-slug}]
//
// Renderiza um PNG 1200×630 com gradiente brand cyan, logo textual
// "VIRALEFY", título da página e preço "from $X.XX". Sem dependências
// externas — usa só `next/og` (ImageResponse) + dados do backend.
//
// Slug é catch-all pra simplificar matching:
//   - 2 segmentos → categoria
//   - 3 segmentos → plano específico (último = `<qty>-<slug>`)

import { ImageResponse } from "next/og";
import { getCountry } from "@/i18n/countries";
import {
  categoryFromSlug,
  categoryLabel,
} from "@/i18n/categories";
import { langOfCountry, type LangCode } from "@/i18n/languages";
import type { Plan } from "@/lib/api";

// Idiomas que satori (renderer next/og) sabe renderizar bem. Scripts RTL
// (árabe, hebraico) + alguns indianos quebram com "lookupType is not yet
// supported". Pra esses ficamos em inglês na OG image (o título HTML da
// página continua localizado — só a imagem usa inglês). BUG-46/100 do QA.
const OG_SAFE_LANGS = new Set<LangCode>([
  "en", "pt", "es", "es_AR", "fr", "de", "it", "nl", "ru", "uk",
  "pl", "sv", "da", "no", "fi", "is", "et", "lv", "lt", "cs",
  "sk", "hu", "ro", "bg", "el", "hr", "sl", "ca", "tr", "id", "vi",
]);
function isOgSafeLang(lang: LangCode): boolean {
  return OG_SAFE_LANGS.has(lang);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

async function getPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { cache: "no-store" });
    const json = await res.json();
    return (json.data as Plan[]) ?? [];
  } catch {
    return [];
  }
}

// Formata o menor preço da lista em USD (a moeda de display global).
function fromPriceLabel(plans: Plan[]): string | null {
  const prices = plans
    .map((p) => parseFloat(p.prices?.["USD"] ?? ""))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (prices.length === 0) return null;
  const lowest = Math.min(...prices);
  return `from $${lowest.toFixed(2)}`;
}

// Para plano específico, devolve `$X.XX`.
function exactPriceLabel(plan: Plan | undefined): string | null {
  if (!plan) return null;
  const usd = parseFloat(plan.prices?.["USD"] ?? "");
  if (Number.isNaN(usd) || usd <= 0) return null;
  return `$${usd.toFixed(2)}`;
}

function qtyFromSlug(slug: string): number | null {
  const m = slug.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : null;
}

// Resolve um country code ISO 3166 para o nome em inglês. Usamos sempre o
// nome inglês na imagem OG porque o renderer do `next/og` (satori) trava
// em ligaduras Árabes complexas ("lookupType: 5 - substFormat: 3 is not
// yet supported"): países como Marrocos, Arábia Saudita e Emirados Árabes
// faziam o /og/{code} responder 502 com corpo vazio.
//
// O `og:title` da página continua usando o nome localizado — só a imagem
// usa inglês, que é o que aparece no preview de redes sociais.
function englishCountryName(code: string, fallback: string): string {
  try {
    const dn = new Intl.DisplayNames("en", { type: "region" });
    return dn.of(code.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await ctx.params;
  const parts = slug ?? [];
  const countryCode = parts[0] ?? "";
  const catSlug = parts[1] ?? "";
  const planSlug = parts[2];

  const country = getCountry(countryCode);
  const cat = catSlug ? categoryFromSlug(catSlug) : undefined;

  // Defaults seguros pra qualquer combinação inválida — devolvemos uma
  // imagem genérica em vez de 404 (Twitter/Facebook insistem em retentar).
  // Renderiza no idioma do país QUANDO o idioma é safe pro satori. Países
  // com script Arabic/Hebrew/Devanagari complexo continuam em inglês pra
  // evitar 502. Fix BUG-46/100 do QA — antes era sempre inglês.
  const lang: LangCode = country ? langOfCountry(country.code) : "en";
  const safe = isOgSafeLang(lang);
  const countryName = country
    ? (safe
        ? country.name
        : englishCountryName(country.code, country.name))
    : "the world";
  const catLabel = cat ? categoryLabel(cat, safe ? lang : "en") : "social growth";

  // Preposição "in/em/en/in/dans/in/v" minúscula. Pra idiomas safe usamos
  // a tradução local — pra idiomas RTL não-safe cai em "in" inglês.
  const inWord: string = safe
    ? (lang === "pt" ? "em"
      : lang === "es" || lang === "es_AR" || lang === "ca" ? "en"
      : lang === "fr" ? "en"
      : lang === "de" ? "in"
      : lang === "it" ? "in"
      : lang === "nl" ? "in"
      : lang === "ru" || lang === "uk" ? "в"
      : "in")
    : "in";

  let title: string;
  let priceLabel: string | null = null;

  if (cat) {
    const allPlans = await getPlans();
    const catPlans = allPlans.filter((p) => p.category === cat);

    if (planSlug) {
      const qty = qtyFromSlug(planSlug);
      const plan = qty != null ? catPlans.find((p) => p.followers_qty === qty) : undefined;
      title = plan ? `${plan.name}` : `${catLabel} ${inWord} ${countryName}`;
      priceLabel = exactPriceLabel(plan) ?? fromPriceLabel(catPlans);
    } else {
      title = `${catLabel} ${inWord} ${countryName}`;
      priceLabel = fromPriceLabel(catPlans);
    }
  } else if (country) {
    title = safe && lang === "pt"
      ? `Cresça em ${countryName}`
      : safe && (lang === "es" || lang === "es_AR")
      ? `Crece en ${countryName}`
      : safe && lang === "fr"
      ? `Grandissez en ${countryName}`
      : safe && lang === "de"
      ? `Wachsen in ${countryName}`
      : safe && lang === "it"
      ? `Cresci in ${countryName}`
      : `Grow in ${countryName}`;
  } else {
    title = "Instagram & TikTok growth worldwide";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #00fed6 0%, #03517a 100%)",
          fontFamily: "sans-serif",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Camada de overlay escura pra dar contraste */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
            display: "flex",
          }}
        />

        {/* Header — logo textual */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "0.06em",
              color: "#ffffff",
              textShadow: "0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            VIRALEFY
          </span>
        </div>

        {/* Título central */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 1,
            flexGrow: 1,
            paddingTop: 30,
          }}
        >
          <div
            style={{
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#ffffff",
              textShadow: "0 4px 14px rgba(0,0,0,0.45)",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer — preço à direita */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.85)",
              display: "flex",
            }}
          >
            Real followers · engagement · views
          </span>
          {priceLabel && (
            <span
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "#00fed6",
                textShadow: "0 2px 8px rgba(0,0,0,0.45)",
                display: "flex",
              }}
            >
              {priceLabel}
            </span>
          )}
        </div>
      </div>
    ),
    SIZE,
  );
}
