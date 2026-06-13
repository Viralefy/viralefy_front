import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CITIES, getCity } from "@/lib/cities";
import { Flag } from "@/components/Flag";
import { categorySlug } from "@/i18n/categories";
import type { LangCode } from "@/i18n/languages";

// Programmatic SEO city LP. 50 rotas estáticas; cada uma fala da cidade
// com bairros/landmarks reais antes de redirecionar pro funnel do país.

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Bairros/landmarks plausíveis (factual) — usados na cópia. Cidades sem
// entrada caem num parágrafo genérico baseado em região.
const LOCAL_FLAVOR: Record<string, { neighborhoods: string[]; landmark: string }> = {
  "new-york-city": { neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Williamsburg"], landmark: "Times Square" },
  "los-angeles": { neighborhoods: ["Hollywood", "Venice Beach", "Santa Monica", "Silver Lake"], landmark: "the Hollywood Sign" },
  "chicago": { neighborhoods: ["the Loop", "Wicker Park", "Lincoln Park"], landmark: "Millennium Park" },
  "houston": { neighborhoods: ["Montrose", "Midtown", "the Heights"], landmark: "Buffalo Bayou" },
  "miami": { neighborhoods: ["South Beach", "Wynwood", "Brickell"], landmark: "Ocean Drive" },
  "toronto": { neighborhoods: ["Queen West", "Yorkville", "Kensington Market"], landmark: "the CN Tower" },
  "vancouver": { neighborhoods: ["Gastown", "Yaletown", "Kitsilano"], landmark: "Stanley Park" },
  "london": { neighborhoods: ["Shoreditch", "Camden", "Soho", "Notting Hill"], landmark: "the Thames" },
  "manchester": { neighborhoods: ["the Northern Quarter", "Ancoats", "Deansgate"], landmark: "Manchester Piccadilly" },
  "birmingham-uk": { neighborhoods: ["Digbeth", "the Jewellery Quarter"], landmark: "the Bullring" },
  "paris": { neighborhoods: ["Le Marais", "Saint-Germain", "Montmartre", "the 11th"], landmark: "the Seine" },
  "lyon": { neighborhoods: ["Vieux Lyon", "Croix-Rousse", "Confluence"], landmark: "the Saône riverfront" },
  "marseille": { neighborhoods: ["Le Panier", "Cours Julien"], landmark: "the Vieux-Port" },
  "madrid": { neighborhoods: ["Malasaña", "Chueca", "La Latina"], landmark: "Gran Vía" },
  "barcelona": { neighborhoods: ["El Born", "Gràcia", "Poblenou"], landmark: "Las Ramblas" },
  "berlin": { neighborhoods: ["Kreuzberg", "Neukölln", "Mitte", "Prenzlauer Berg"], landmark: "the Spree" },
  "munich": { neighborhoods: ["Schwabing", "Maxvorstadt", "Glockenbach"], landmark: "the Englischer Garten" },
  "hamburg": { neighborhoods: ["St. Pauli", "Sternschanze", "HafenCity"], landmark: "the Elbphilharmonie" },
  "rome": { neighborhoods: ["Trastevere", "Monti", "Testaccio"], landmark: "the Tiber" },
  "milan": { neighborhoods: ["Brera", "Navigli", "Porta Nuova"], landmark: "the Duomo" },
  "amsterdam": { neighborhoods: ["De Pijp", "Jordaan", "Oud-West"], landmark: "the canal ring" },
  "brussels": { neighborhoods: ["Ixelles", "Saint-Gilles", "Sainte-Catherine"], landmark: "the Grand Place" },
  "dublin": { neighborhoods: ["Temple Bar", "Portobello", "Stoneybatter"], landmark: "the Liffey" },
  "lisbon": { neighborhoods: ["Bairro Alto", "Alfama", "Príncipe Real"], landmark: "the Tagus" },
  "vienna": { neighborhoods: ["Neubau", "Leopoldstadt", "Mariahilf"], landmark: "the Ringstraße" },
  "zurich": { neighborhoods: ["Kreis 4", "Kreis 5", "Niederdorf"], landmark: "Lake Zurich" },
  "stockholm": { neighborhoods: ["Södermalm", "Vasastan", "Östermalm"], landmark: "Gamla Stan" },
  "copenhagen": { neighborhoods: ["Vesterbro", "Nørrebro", "Christianshavn"], landmark: "Nyhavn" },
  "warsaw": { neighborhoods: ["Praga", "Powiśle", "Mokotów"], landmark: "the Vistula" },
  "sydney": { neighborhoods: ["Surry Hills", "Newtown", "Bondi"], landmark: "the Opera House" },
  "melbourne": { neighborhoods: ["Fitzroy", "Brunswick", "St Kilda"], landmark: "the Yarra" },
  "sao-paulo": { neighborhoods: ["Vila Madalena", "Pinheiros", "Jardins", "Itaim"], landmark: "Avenida Paulista" },
  "rio-de-janeiro": { neighborhoods: ["Ipanema", "Leblon", "Copacabana", "Botafogo"], landmark: "Sugarloaf" },
  "mexico-city": { neighborhoods: ["Roma", "Condesa", "Polanco", "Coyoacán"], landmark: "the Zócalo" },
  "buenos-aires": { neighborhoods: ["Palermo", "Recoleta", "San Telmo"], landmark: "the Obelisco" },
  "bogota": { neighborhoods: ["Chapinero", "La Candelaria", "Usaquén"], landmark: "Monserrate" },
  "santiago": { neighborhoods: ["Providencia", "Bellavista", "Lastarria"], landmark: "Cerro San Cristóbal" },
  "lima": { neighborhoods: ["Miraflores", "Barranco", "San Isidro"], landmark: "the Malecón" },
  "dubai": { neighborhoods: ["Downtown", "Dubai Marina", "JBR", "Business Bay"], landmark: "the Burj Khalifa" },
  "riyadh": { neighborhoods: ["Olaya", "Al Malqa", "Diplomatic Quarter"], landmark: "Kingdom Centre" },
  "tel-aviv": { neighborhoods: ["Florentin", "Neve Tzedek", "Rothschild"], landmark: "the Tayelet" },
  "istanbul": { neighborhoods: ["Beyoğlu", "Karaköy", "Kadıköy"], landmark: "the Bosphorus" },
  "cairo": { neighborhoods: ["Zamalek", "Maadi", "Downtown"], landmark: "the Nile" },
  "mumbai": { neighborhoods: ["Bandra", "Andheri", "Lower Parel"], landmark: "Marine Drive" },
  "delhi": { neighborhoods: ["Hauz Khas", "Connaught Place", "Saket"], landmark: "India Gate" },
  "bangalore": { neighborhoods: ["Indiranagar", "Koramangala", "HSR Layout"], landmark: "Cubbon Park" },
  "tokyo": { neighborhoods: ["Shibuya", "Shinjuku", "Harajuku", "Daikanyama"], landmark: "the Shibuya Crossing" },
  "seoul": { neighborhoods: ["Gangnam", "Hongdae", "Itaewon", "Seongsu"], landmark: "the Han River" },
  "singapore": { neighborhoods: ["Tiong Bahru", "Tanjong Pagar", "Holland Village"], landmark: "Marina Bay" },
  "bangkok": { neighborhoods: ["Sukhumvit", "Thonglor", "Ari"], landmark: "the Chao Phraya" },
};

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "City not found" };

  const url = siteUrl();
  const meta = indexableMeta();
  const title = `Buy Instagram followers in ${city.name} — local growth | Viralefy`;
  const description = `Grow your Instagram and TikTok in ${city.name}. Real followers, likes and views with delivery tuned to local time zones. Pay in USDT/USD and ship in minutes.`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/cities/${city.slug}`,
      languages: {
        "x-default": `/cities/${city.slug}`,
        en: `/cities/${city.slug}`,
      },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      locale: "en_US",
      type: "article",
      url: `${url}/cities/${city.slug}`,
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

function neighborhoodsText(slug: string, city: string): { hoods: string; landmark: string } {
  const flavor = LOCAL_FLAVOR[slug];
  if (!flavor) return { hoods: `central ${city}`, landmark: `${city}` };
  const list = flavor.neighborhoods;
  const last = list[list.length - 1];
  const head = list.slice(0, -1).join(", ");
  return { hoods: list.length > 1 ? `${head} and ${last}` : last, landmark: flavor.landmark };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/cities/${city.slug}`;
  // BUG-90/163 do QA 2026-06-12: ctaHref apontava pra alias EN
  // (/br/instagram-followers) que gerava conteúdo duplicado sem 301 — o
  // canonical próprio mascarava o problema. Agora gera o slug localizado
  // a partir do htmlLang da cidade.
  const cityLang = (city.htmlLang.split("-")[0] || "en") as LangCode;
  const ctaSlug = categorySlug("seguidores_instagram", cityLang);
  const ctaHref = `/${city.country}/${ctaSlug}`;
  const { hoods, landmark } = neighborhoodsText(city.slug, city.name);

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: `Buy Instagram followers in ${city.name}`,
      url: pageUrl,
      inLanguage: "en",
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Cities", item: `${url}/cities` },
        { "@type": "ListItem", position: 3, name: city.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: `Instagram & TikTok growth in ${city.name}`,
      serviceType: "Social media growth",
      provider: {
        "@type": "Organization",
        name: "Viralefy",
        url,
      },
      areaServed: {
        "@type": "Place",
        name: city.name,
        address: { "@type": "PostalAddress", addressCountry: city.country.toUpperCase() },
      },
      url: pageUrl,
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <article lang="en">
        <header className="hero container" style={{ textAlign: "center", maxWidth: 820, margin: "0 auto", padding: "3rem 1rem 1.5rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <Flag code={city.country} width={80} title={city.name} style={{ borderRadius: "4px" }} />
          </div>
          <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15, margin: "0 0 1rem" }}>
            Buy Instagram followers in {city.name}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0 auto", maxWidth: 640 }}>
            Local audience, real engagement, instant delivery — built for creators and brands across {city.name}.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={ctaHref} className="btn btn-primary">See {city.name} plans</Link>
            <Link href="/cities" className="btn btn-outline">All cities</Link>
          </div>
        </header>

        <main className="container" style={{ maxWidth: 820, paddingBottom: "4rem" }}>
          <section style={{ marginTop: "2rem", lineHeight: 1.7, color: "var(--text)" }}>
            <p>
              Whether you are a creator filming around {landmark}, a small brand pushing pop-ups
              through {hoods}, or an agency scaling client accounts across {city.name},
              audience density is the bottleneck. Viralefy ships Instagram followers, likes,
              comments and TikTok views with delivery windows aligned to your local time zone — so
              new social proof lands when your local audience is actually online.
            </p>
            <p>
              {city.name} is one of the most competitive feeds in the world. With more than{" "}
              {city.population.toLocaleString("en-US")} residents and a dense creator economy,
              breaking the algorithm&apos;s warm-up phase without an initial push is brutal. Our
              starter packs cover that gap: a measured ramp of real-looking accounts that earns
              your post into the explore tab, then organic engagement compounds from there.
            </p>
            <p>
              Every order is paid in USDT or USD, settled on-chain so there are no chargebacks and
              no exposed card data. Delivery starts within minutes of confirmation and finishes
              over hours or days depending on package size — the slow drip is intentional, it
              mirrors organic patterns so platform safety systems treat the growth as normal. You
              can monitor delivery from your dashboard and pause or top up any time.
            </p>
            <p>
              The {city.name} market trades on aesthetic — what wins in {hoods} won&apos;t win in a
              suburban feed two cities over. We don&apos;t pretend to fix your content. What we do
              is remove the cold-start tax so the content you already make gets the surface area
              it deserves. If you are unsure which package fits your stage, our team answers on
              WhatsApp in English and the city&apos;s main language.
            </p>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem" }}>Why creators in {city.name} pick Viralefy</h2>
            <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.7, color: "var(--text)" }}>
              <li>Real-looking accounts with profile photos, bios and posting history — no bot signatures.</li>
              <li>Delivery drip tuned to {city.name} time zone so growth lands during local peak hours.</li>
              <li>USDT/USD pricing — no FX surprises, no card data, no chargebacks.</li>
              <li>Refill guarantee against drops for 30 days on every follower package.</li>
              <li>Same dashboard for Instagram, TikTok, and recovery requests.</li>
              <li>Support in English plus the primary local language of {city.name}.</li>
            </ul>
          </section>

          <section className="card" style={{ marginTop: "2.5rem", padding: "1.5rem", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>Ready to grow in {city.name}?</h2>
            <p style={{ color: "var(--muted)", margin: "0 0 1.25rem" }}>
              Pick a plan tuned to the {city.country.toUpperCase()} market — followers, likes or views, delivered today.
            </p>
            <Link href={ctaHref} className="btn btn-primary">View Instagram follower plans</Link>
          </section>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
