// Catálogo de competidores públicos do nicho de social-engagement.
// Dados plausíveis baseados em info pública. Atributos incertos = null.

export type Competitor = {
  slug: string;
  name: string;
  tagline: string;
  priceFloorUsd: number;
  deliveryWindowHours: number;
  offersRefill: boolean;
  supportChannels: string[];
  cryptoPayments: boolean;
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "socialplug",
    name: "SocialPlug",
    tagline: "UK-based social growth marketplace with a wide catalog.",
    priceFloorUsd: 1.99,
    deliveryWindowHours: 24,
    offersRefill: true,
    supportChannels: ["email", "live chat"],
    cryptoPayments: false,
  },
  {
    slug: "stormlikes",
    name: "Stormlikes",
    tagline: "Instagram-first provider focused on likes and views.",
    priceFloorUsd: 1.49,
    deliveryWindowHours: 12,
    offersRefill: false,
    supportChannels: ["email"],
    cryptoPayments: false,
  },
  {
    slug: "mediamister",
    name: "MediaMister",
    tagline: "Long-running multi-platform growth service since 2012.",
    priceFloorUsd: 2.0,
    deliveryWindowHours: 48,
    offersRefill: true,
    supportChannels: ["email", "ticket"],
    cryptoPayments: true,
  },
  {
    slug: "twicsy",
    name: "Twicsy",
    tagline: "Instant Instagram likes, followers and views at low entry price.",
    priceFloorUsd: 1.47,
    deliveryWindowHours: 6,
    offersRefill: false,
    supportChannels: ["email"],
    cryptoPayments: false,
  },
  {
    slug: "buzzoid",
    name: "Buzzoid",
    tagline: "Instagram engagement specialist with fast delivery.",
    priceFloorUsd: 2.97,
    deliveryWindowHours: 6,
    offersRefill: false,
    supportChannels: ["email"],
    cryptoPayments: false,
  },
  {
    slug: "viewsta",
    name: "Viewsta",
    tagline: "Views-first provider covering TikTok, YouTube and Instagram.",
    priceFloorUsd: 0.99,
    deliveryWindowHours: 24,
    offersRefill: false,
    supportChannels: ["email"],
    cryptoPayments: false,
  },
  {
    slug: "instamber",
    name: "InstaMber",
    tagline: "Instagram-only follower and like packs.",
    priceFloorUsd: 2.49,
    deliveryWindowHours: 24,
    offersRefill: true,
    supportChannels: ["email"],
    cryptoPayments: false,
  },
  {
    slug: "growthoid",
    name: "Growthoid",
    tagline: "Managed Instagram growth service with a human account manager.",
    priceFloorUsd: 49.0,
    deliveryWindowHours: 168,
    offersRefill: false,
    supportChannels: ["email", "account manager"],
    cryptoPayments: false,
  },
  {
    slug: "famoid",
    name: "Famoid",
    tagline: "Multi-platform engagement with PayPal and card checkout.",
    priceFloorUsd: 2.95,
    deliveryWindowHours: 24,
    offersRefill: true,
    supportChannels: ["email", "ticket"],
    cryptoPayments: false,
  },
  {
    slug: "likes-io",
    name: "Likes.io",
    tagline: "Instagram and TikTok subscriptions for recurring engagement.",
    priceFloorUsd: 4.0,
    deliveryWindowHours: 24,
    offersRefill: true,
    supportChannels: ["email", "live chat"],
    cryptoPayments: false,
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
