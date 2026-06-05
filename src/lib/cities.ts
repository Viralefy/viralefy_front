// Catálogo programmatic SEO de cidades. 50 mercados onde Instagram/TikTok
// engagement tem demanda comprovada. country = ISO alpha-2 minúsculo, casa
// com COUNTRIES; htmlLang segue o BCP47 do mercado principal do país.

export type City = {
  slug: string;
  name: string;
  country: string;
  htmlLang: string;
  region: "americas" | "europe" | "asia" | "mena" | "africa" | "oceania";
  population: number;
  flag: string;
};

export const CITIES: City[] = [
  // Americas
  { slug: "new-york-city", name: "New York City", country: "us", htmlLang: "en-US", region: "americas", population: 8336000, flag: "🇺🇸" },
  { slug: "los-angeles", name: "Los Angeles", country: "us", htmlLang: "en-US", region: "americas", population: 3979000, flag: "🇺🇸" },
  { slug: "chicago", name: "Chicago", country: "us", htmlLang: "en-US", region: "americas", population: 2693000, flag: "🇺🇸" },
  { slug: "houston", name: "Houston", country: "us", htmlLang: "en-US", region: "americas", population: 2320000, flag: "🇺🇸" },
  { slug: "miami", name: "Miami", country: "us", htmlLang: "en-US", region: "americas", population: 467000, flag: "🇺🇸" },
  { slug: "toronto", name: "Toronto", country: "ca", htmlLang: "en-CA", region: "americas", population: 2930000, flag: "🇨🇦" },
  { slug: "vancouver", name: "Vancouver", country: "ca", htmlLang: "en-CA", region: "americas", population: 675000, flag: "🇨🇦" },
  { slug: "sao-paulo", name: "São Paulo", country: "br", htmlLang: "pt-BR", region: "americas", population: 12330000, flag: "🇧🇷" },
  { slug: "rio-de-janeiro", name: "Rio de Janeiro", country: "br", htmlLang: "pt-BR", region: "americas", population: 6748000, flag: "🇧🇷" },
  { slug: "mexico-city", name: "Mexico City", country: "mx", htmlLang: "es-MX", region: "americas", population: 9209000, flag: "🇲🇽" },
  { slug: "buenos-aires", name: "Buenos Aires", country: "ar", htmlLang: "es-AR", region: "americas", population: 3075000, flag: "🇦🇷" },
  { slug: "bogota", name: "Bogotá", country: "co", htmlLang: "es-CO", region: "americas", population: 7181000, flag: "🇨🇴" },
  { slug: "santiago", name: "Santiago", country: "cl", htmlLang: "es-CL", region: "americas", population: 6680000, flag: "🇨🇱" },
  { slug: "lima", name: "Lima", country: "pe", htmlLang: "es-PE", region: "americas", population: 9751000, flag: "🇵🇪" },

  // Europe
  { slug: "london", name: "London", country: "gb", htmlLang: "en-GB", region: "europe", population: 8982000, flag: "🇬🇧" },
  { slug: "manchester", name: "Manchester", country: "gb", htmlLang: "en-GB", region: "europe", population: 553000, flag: "🇬🇧" },
  { slug: "birmingham-uk", name: "Birmingham (UK)", country: "gb", htmlLang: "en-GB", region: "europe", population: 1141000, flag: "🇬🇧" },
  { slug: "paris", name: "Paris", country: "fr", htmlLang: "fr-FR", region: "europe", population: 2161000, flag: "🇫🇷" },
  { slug: "lyon", name: "Lyon", country: "fr", htmlLang: "fr-FR", region: "europe", population: 518000, flag: "🇫🇷" },
  { slug: "marseille", name: "Marseille", country: "fr", htmlLang: "fr-FR", region: "europe", population: 870000, flag: "🇫🇷" },
  { slug: "madrid", name: "Madrid", country: "es", htmlLang: "es-ES", region: "europe", population: 3266000, flag: "🇪🇸" },
  { slug: "barcelona", name: "Barcelona", country: "es", htmlLang: "es-ES", region: "europe", population: 1620000, flag: "🇪🇸" },
  { slug: "berlin", name: "Berlin", country: "de", htmlLang: "de-DE", region: "europe", population: 3645000, flag: "🇩🇪" },
  { slug: "munich", name: "Munich", country: "de", htmlLang: "de-DE", region: "europe", population: 1488000, flag: "🇩🇪" },
  { slug: "hamburg", name: "Hamburg", country: "de", htmlLang: "de-DE", region: "europe", population: 1899000, flag: "🇩🇪" },
  { slug: "rome", name: "Rome", country: "it", htmlLang: "it-IT", region: "europe", population: 2873000, flag: "🇮🇹" },
  { slug: "milan", name: "Milan", country: "it", htmlLang: "it-IT", region: "europe", population: 1396000, flag: "🇮🇹" },
  { slug: "amsterdam", name: "Amsterdam", country: "nl", htmlLang: "nl-NL", region: "europe", population: 872000, flag: "🇳🇱" },
  { slug: "brussels", name: "Brussels", country: "be", htmlLang: "nl-BE", region: "europe", population: 1209000, flag: "🇧🇪" },
  { slug: "dublin", name: "Dublin", country: "ie", htmlLang: "en-IE", region: "europe", population: 1388000, flag: "🇮🇪" },
  { slug: "lisbon", name: "Lisbon", country: "pt", htmlLang: "pt-PT", region: "europe", population: 504000, flag: "🇵🇹" },
  { slug: "vienna", name: "Vienna", country: "at", htmlLang: "de-AT", region: "europe", population: 1911000, flag: "🇦🇹" },
  { slug: "zurich", name: "Zurich", country: "ch", htmlLang: "de-CH", region: "europe", population: 421000, flag: "🇨🇭" },
  { slug: "stockholm", name: "Stockholm", country: "se", htmlLang: "sv-SE", region: "europe", population: 975000, flag: "🇸🇪" },
  { slug: "copenhagen", name: "Copenhagen", country: "dk", htmlLang: "da-DK", region: "europe", population: 660000, flag: "🇩🇰" },
  { slug: "warsaw", name: "Warsaw", country: "pl", htmlLang: "pl-PL", region: "europe", population: 1793000, flag: "🇵🇱" },

  // Oceania
  { slug: "sydney", name: "Sydney", country: "au", htmlLang: "en-AU", region: "oceania", population: 5312000, flag: "🇦🇺" },
  { slug: "melbourne", name: "Melbourne", country: "au", htmlLang: "en-AU", region: "oceania", population: 5078000, flag: "🇦🇺" },

  // MENA
  { slug: "dubai", name: "Dubai", country: "ae", htmlLang: "ar-AE", region: "mena", population: 3331000, flag: "🇦🇪" },
  { slug: "riyadh", name: "Riyadh", country: "sa", htmlLang: "ar-SA", region: "mena", population: 7676000, flag: "🇸🇦" },
  { slug: "tel-aviv", name: "Tel Aviv", country: "il", htmlLang: "he-IL", region: "mena", population: 460000, flag: "🇮🇱" },
  { slug: "istanbul", name: "Istanbul", country: "tr", htmlLang: "tr-TR", region: "mena", population: 15460000, flag: "🇹🇷" },
  { slug: "cairo", name: "Cairo", country: "eg", htmlLang: "ar-EG", region: "mena", population: 9540000, flag: "🇪🇬" },

  // Asia
  { slug: "mumbai", name: "Mumbai", country: "in", htmlLang: "hi-IN", region: "asia", population: 20411000, flag: "🇮🇳" },
  { slug: "delhi", name: "Delhi", country: "in", htmlLang: "hi-IN", region: "asia", population: 32941000, flag: "🇮🇳" },
  { slug: "bangalore", name: "Bangalore", country: "in", htmlLang: "hi-IN", region: "asia", population: 13193000, flag: "🇮🇳" },
  { slug: "tokyo", name: "Tokyo", country: "jp", htmlLang: "ja-JP", region: "asia", population: 13960000, flag: "🇯🇵" },
  { slug: "seoul", name: "Seoul", country: "kr", htmlLang: "ko-KR", region: "asia", population: 9776000, flag: "🇰🇷" },
  { slug: "singapore", name: "Singapore", country: "sg", htmlLang: "en-SG", region: "asia", population: 5686000, flag: "🇸🇬" },
  { slug: "bangkok", name: "Bangkok", country: "th", htmlLang: "th-TH", region: "asia", population: 10539000, flag: "🇹🇭" },
];

export const REGION_LABEL: Record<City["region"], string> = {
  americas: "Americas",
  europe: "Europe",
  asia: "Asia",
  mena: "Middle East & North Africa",
  africa: "Africa",
  oceania: "Oceania",
};

export const REGION_ORDER: City["region"][] = ["americas", "europe", "oceania", "mena", "asia", "africa"];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function citiesByRegion(): Record<City["region"], City[]> {
  const out = { americas: [], europe: [], asia: [], mena: [], africa: [], oceania: [] } as Record<City["region"], City[]>;
  for (const c of CITIES) out[c.region].push(c);
  return out;
}
