import type { Country } from "@/i18n/countries";
import type { Plan } from "./api";

// Schema.org JSON-LD para landing de país. Blocos emitidos:
//   - Organization (marca, logo, contactPoint, sameAs)
//   - WebSite (com SearchAction de país)
//   - WebPage (página em si, inLanguage)
//   - BreadcrumbList
//   - Service + AggregateOffer (com price em USD, derivado dos prices map
//     manualmente curados em plans.prices — USD é o display default)
//
// Cada bloco é serializado em <script type="application/ld+json">. Compatível
// com Rich Results Test do Google + JSON-LD Validator do Schema.org.

// Preferência de moeda no JSON-LD. USD é a moeda mais portável globalmente
// pro Google e Bing — caímos pra outras se USD não estiver no plan.prices.
const PREFERRED_OFFER_CURRENCIES = ["USD", "EUR", "BRL", "USDT", "BTC"] as const;

function pickOfferCurrency(prices: Record<string, string> | undefined): { code: string; amount: string } | null {
  if (!prices) return null;
  for (const code of PREFERRED_OFFER_CURRENCIES) {
    if (prices[code]) return { code, amount: prices[code] };
  }
  // Último recurso: pega a primeira disponível.
  const first = Object.entries(prices)[0];
  return first ? { code: first[0], amount: first[1] } : null;
}

export function buildCountryJsonLd(country: Country, plans: Plan[], siteUrl: string) {
  const pageUrl = `${siteUrl}/${country.code}`;
  const logoUrl = `${siteUrl}/logo.png`;

  // Offers — uma por plano, com moeda preferencial e info de região.
  const offers = plans.map((p) => {
    const priced = pickOfferCurrency(p.prices) ?? { code: "USD", amount: (p.price_cents / 100).toFixed(2) };
    return {
      "@type": "Offer",
      name: p.name,
      sku: p.id,
      price: priced.amount,
      priceCurrency: priced.code,
      url: pageUrl,
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: country.name },
      // priceValidUntil (1 ano a partir de agora) atende validação do Google
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
  });

  // Bucket de preços só pra AggregateOffer (mesma moeda). Pega o primeiro plano
  // pra definir a moeda de display do agregado.
  const firstOfferCurrency = offers[0]?.priceCurrency ?? "USD";
  const sameCurrencyOffers = offers.filter((o) => o.priceCurrency === firstOfferCurrency);
  const prices = sameCurrencyOffers.map((o) => parseFloat(o.price)).filter((n) => !isNaN(n));
  const low = prices.length ? Math.min(...prices).toFixed(2) : "0";
  const high = prices.length ? Math.max(...prices).toFixed(2) : "0";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Viralefy",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 2471,
      height: 704,
    },
    sameAs: [
      "https://github.com/Viralefy",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "ja", "ar"],
      url: `${siteUrl}/legal/contact?lang=en`,
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Viralefy",
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: country.htmlLang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/{country_code}`,
      },
      "query-input": "required name=country_code",
    },
  };

  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: country.title,
    description: country.description,
    inLanguage: country.htmlLang,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: country.name, item: pageUrl },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: country.h1,
    description: country.description,
    serviceType: "Social media growth",
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "Country", name: country.name },
    inLanguage: country.htmlLang,
    offers: offers.length > 0 ? {
      "@type": "AggregateOffer",
      priceCurrency: firstOfferCurrency,
      lowPrice: low,
      highPrice: high,
      offerCount: offers.length,
      offers,
    } : undefined,
  };

  return [organization, website, webpage, breadcrumb, service];
}
