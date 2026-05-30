import type { Country } from "@/i18n/countries";
import type { Plan } from "./api";

// Gera os blocos JSON-LD para uma landing de país:
//   - Organization (a marca)
//   - WebSite (site)
//   - WebPage (a página em si, inLanguage)
//   - BreadcrumbList (Home > País)
//   - Service + AggregateOffer (serviço com lista de ofertas de planos)
// Cada bloco vira um <script type="application/ld+json"> na página.
export function buildCountryJsonLd(country: Country, plans: Plan[], siteUrl: string) {
  const pageUrl = `${siteUrl}/${country.code}`;
  const offers = plans.map((p) => {
    const brl = p.prices?.["BRL"] ?? (p.price_cents / 100).toFixed(2);
    return {
      "@type": "Offer",
      name: p.name,
      price: brl,
      priceCurrency: "BRL",
      url: pageUrl,
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: country.name },
    };
  });
  const prices = offers.map((o) => parseFloat(o.price)).filter((n) => !isNaN(n));
  const low = prices.length ? Math.min(...prices).toFixed(2) : "0";
  const high = prices.length ? Math.max(...prices).toFixed(2) : "0";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Viralefy",
    url: siteUrl,
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Viralefy",
    url: siteUrl,
  };
  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    name: country.title,
    description: country.description,
    inLanguage: country.htmlLang,
    isPartOf: { "@type": "WebSite", name: "Viralefy", url: siteUrl },
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
    name: country.h1,
    description: country.description,
    provider: { "@type": "Organization", name: "Viralefy", url: siteUrl },
    areaServed: { "@type": "Country", name: country.name },
    inLanguage: country.htmlLang,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: low,
      highPrice: high,
      offerCount: offers.length,
      offers,
    },
  };

  return [organization, website, webpage, breadcrumb, service];
}
