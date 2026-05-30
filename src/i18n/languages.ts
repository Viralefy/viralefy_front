// Pacote central de traduções. Os textos da UI ficam aqui indexados por
// "language family" (pt, en, es, …), enquanto `countries.ts` mantém o mapa
// país → idioma. Lookup com fallback para inglês: `tr(lang).header.login`.

export type LangCode =
  | "pt" | "en" | "es" | "es_AR" | "fr" | "de" | "it" | "nl"
  | "pl" | "sv" | "da" | "no" | "fi" | "is" | "et" | "lv" | "lt"
  | "cs" | "sk" | "hu" | "ro" | "bg" | "el" | "hr" | "sl" | "ca";

// Mapa país → idioma. Para países sem entrada cai no inglês.
const COUNTRY_LANG: Record<string, LangCode> = {
  // pt
  br: "pt", pt: "pt",
  // en (americas + sepa + caribbean + global default)
  us: "en", ca: "en", gb: "en", ie: "en", mt: "en", gi: "en",
  jm: "en", tt: "en", bs: "en", bb: "en", bz: "en", gy: "en",
  // es (regional spanish — Argentina destaca-se com voseo)
  mx: "es", gt: "es", hn: "es", sv: "es", ni: "es", cr: "es", pa: "es",
  cu: "es", do: "es", pr: "es", es: "es",
  cl: "es", co: "es", ec: "es", ve: "es", pe: "es", bo: "es",
  py: "es", uy: "es", ar: "es_AR",
  // fr
  ht: "fr", fr: "fr", lu: "fr", mc: "fr",
  // de
  de: "de", at: "de", ch: "de", li: "de",
  // it
  it: "it", sm: "it", va: "it",
  // nl
  nl: "nl", be: "nl", sr: "nl",
  // outros
  pl: "pl", se: "sv", dk: "da", no: "no", fi: "fi", is: "is",
  ee: "et", lv: "lv", lt: "lt",
  cz: "cs", sk: "sk", hu: "hu", ro: "ro", bg: "bg",
  gr: "el", cy: "el", hr: "hr", si: "sl", ad: "ca",
};

export function langOfCountry(code: string): LangCode {
  return COUNTRY_LANG[code.toLowerCase()] ?? "en";
}

export type Pack = {
  // página global / home
  home: {
    heroTitle: string;
    heroSubtitle: string;
    plansByService: string;
    pickMarket: string;
    pickService: string;
    viewService: string;
  };
  header: {
    login: string;
    register: string;
    account: string;
    support: string;
    logout: string;
    currency: string;
    markets: string;
    searchPlaceholder: string;
    searchNoResults: string;
    regionAmericas: string;
    regionSepa: string;
  };
  footer: {
    tagline: string;
    sections: { legal: string; site: string; markets: string };
    links: {
      privacy: string;
      terms: string;
      cookies: string;
      refund: string;
      contact: string;
      about: string;
    };
    copyright: string;
    disclaimer: string;
  };
  cta: {
    buy: string;
    buyNow: string;
    seeAll: string;
    seeRange: string;
    seeCards: string;
    backToHome: string;
    backToCategory: string;
  };
  category: {
    intro: string;            // "Escolha seu serviço" cabeçalho da lista
    chooseQty: string;        // "Quantos seguidores?"
    suggested: string;        // "Plano sugerido"
    total: string;            // "Total"
    perUnit: string;          // "por unidade"
    compareAll: string;       // "Compare todos os planos"
    table: { plan: string; qty: string; price: string };
    faq: string;              // "Perguntas frequentes"
    breadcrumb: string;       // "Início"
    in: string;               // "em" — usado em "em <País>"
  };
  plan: {
    delivery: string;         // "Entrega rápida"
    deliveryDesc: string;     // ex. "início em até 30 minutos"
    safe: string;             // "Sem senha"
    safeDesc: string;
    refill: string;           // "Reposição garantida"
    refillDesc: string;
    support: string;          // "Suporte humano"
    supportDesc: string;
    detailsTitle: string;     // "Detalhes do pacote"
    whyTitle: string;         // "Por que esse pacote?"
    relatedTitle: string;     // "Outros pacotes da mesma categoria"
  };
};

// ---------- Pacote base (en-US) ----------
const en: Pack = {
  home: {
    heroTitle: "Grow your Instagram & TikTok",
    heroSubtitle: "Real followers, engagement and views with fast delivery. Pay in USD, EUR, BRL or crypto.",
    plansByService: "Services",
    pickMarket: "Markets & languages",
    pickService: "Pick a service",
    viewService: "View details",
  },
  header: {
    login: "Sign in",
    register: "Create account",
    account: "My account",
    support: "Support",
    logout: "Sign out",
    currency: "Currency",
    markets: "Markets",
    searchPlaceholder: "Search services and markets…",
    searchNoResults: "No matches.",
    regionAmericas: "Americas",
    regionSepa: "Europe / SEPA",
  },
  footer: {
    tagline: "Responsible social media growth.",
    sections: { legal: "Legal", site: "Site", markets: "Markets" },
    links: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      refund: "Refund Policy",
      contact: "Contact support",
      about: "About Viralefy",
    },
    copyright: "All rights reserved.",
    disclaimer: "Viralefy is not affiliated with Instagram, TikTok or Meta Platforms.",
  },
  cta: {
    buy: "Buy",
    buyNow: "Buy now",
    seeAll: "See all plans",
    seeRange: "Use the slider version",
    seeCards: "Use the cards version",
    backToHome: "Back to home",
    backToCategory: "Back to category",
  },
  category: {
    intro: "Pick a plan",
    chooseQty: "How many?",
    suggested: "Suggested plan",
    total: "Total",
    perUnit: "per unit",
    compareAll: "Compare every plan",
    table: { plan: "Plan", qty: "Quantity", price: "Price" },
    faq: "FAQ",
    breadcrumb: "Home",
    in: "in",
  },
  plan: {
    delivery: "Fast delivery",
    deliveryDesc: "Most orders start within 30 minutes after payment is confirmed.",
    safe: "No password required",
    safeDesc: "We never ask for your account password. Just hand us your public @ or the public URL.",
    refill: "Refill guarantee",
    refillDesc: "Drops within 30 days are refilled at no cost.",
    support: "Human support",
    supportDesc: "Real people answering tickets in your language, not bots.",
    detailsTitle: "What's in this package",
    whyTitle: "Why this package?",
    relatedTitle: "Other packages in this category",
  },
};

// ---------- Português (pt-BR / pt-PT) ----------
const pt: Pack = {
  home: {
    heroTitle: "Cresça no Instagram e TikTok",
    heroSubtitle: "Seguidores, curtidas e visualizações com entrega rápida. Pague em real, dólar, euro ou cripto.",
    plansByService: "Serviços",
    pickMarket: "Mercados e idiomas",
    pickService: "Escolha um serviço",
    viewService: "Ver detalhes",
  },
  header: {
    login: "Entrar",
    register: "Criar conta",
    account: "Minha conta",
    support: "Suporte",
    logout: "Sair",
    currency: "Moeda",
    markets: "Mercados",
    searchPlaceholder: "Buscar serviços e mercados…",
    searchNoResults: "Nenhum resultado.",
    regionAmericas: "Américas",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Crescimento responsável em redes sociais.",
    sections: { legal: "Jurídico", site: "Site", markets: "Mercados" },
    links: {
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      cookies: "Política de Cookies",
      refund: "Política de Reembolso",
      contact: "Contato",
      about: "Sobre a Viralefy",
    },
    copyright: "Todos os direitos reservados.",
    disclaimer: "Viralefy não é afiliada ao Instagram, TikTok ou Meta Platforms.",
  },
  cta: {
    buy: "Comprar",
    buyNow: "Comprar agora",
    seeAll: "Ver todos os planos",
    seeRange: "Ver versão com slider",
    seeCards: "Ver versão em cards",
    backToHome: "Voltar para a home",
    backToCategory: "Voltar para a categoria",
  },
  category: {
    intro: "Escolha um plano",
    chooseQty: "Quantos?",
    suggested: "Plano sugerido",
    total: "Total",
    perUnit: "por unidade",
    compareAll: "Compare todos os planos",
    table: { plan: "Plano", qty: "Quantidade", price: "Preço" },
    faq: "Perguntas frequentes",
    breadcrumb: "Início",
    in: "em",
  },
  plan: {
    delivery: "Entrega rápida",
    deliveryDesc: "A maioria dos pedidos começa em até 30 minutos após a confirmação do pagamento.",
    safe: "Não pedimos sua senha",
    safeDesc: "Nunca solicitamos a senha da sua conta. Basta nos passar seu @ público ou o link da publicação.",
    refill: "Reposição garantida",
    refillDesc: "Quedas dentro de 30 dias são repostas sem custo.",
    support: "Atendimento humano",
    supportDesc: "Pessoas reais respondendo no seu idioma — nada de bots.",
    detailsTitle: "O que vem nesse pacote",
    whyTitle: "Por que esse pacote?",
    relatedTitle: "Outros pacotes da mesma categoria",
  },
};

// ---------- Español (es) ----------
const es: Pack = {
  home: {
    heroTitle: "Haz crecer tu Instagram y TikTok",
    heroSubtitle: "Seguidores, interacciones y vistas con entrega rápida. Paga en USD, EUR o cripto.",
    plansByService: "Servicios",
    pickMarket: "Mercados e idiomas",
    pickService: "Elige un servicio",
    viewService: "Ver detalles",
  },
  header: {
    login: "Iniciar sesión",
    register: "Crear cuenta",
    account: "Mi cuenta",
    support: "Soporte",
    logout: "Salir",
    currency: "Moneda",
    markets: "Mercados",
    searchPlaceholder: "Buscar servicios y mercados…",
    searchNoResults: "Sin resultados.",
    regionAmericas: "Américas",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Crecimiento responsable en redes sociales.",
    sections: { legal: "Legal", site: "Sitio", markets: "Mercados" },
    links: {
      privacy: "Política de Privacidad",
      terms: "Términos de Servicio",
      cookies: "Política de Cookies",
      refund: "Política de Reembolso",
      contact: "Contacto",
      about: "Acerca de Viralefy",
    },
    copyright: "Todos los derechos reservados.",
    disclaimer: "Viralefy no está afiliada a Instagram, TikTok ni Meta Platforms.",
  },
  cta: {
    buy: "Comprar",
    buyNow: "Comprar ahora",
    seeAll: "Ver todos los planes",
    seeRange: "Ver versión con slider",
    seeCards: "Ver versión en tarjetas",
    backToHome: "Volver al inicio",
    backToCategory: "Volver a la categoría",
  },
  category: {
    intro: "Elige un plan",
    chooseQty: "¿Cuántos?",
    suggested: "Plan sugerido",
    total: "Total",
    perUnit: "por unidad",
    compareAll: "Compara todos los planes",
    table: { plan: "Plan", qty: "Cantidad", price: "Precio" },
    faq: "Preguntas frecuentes",
    breadcrumb: "Inicio",
    in: "en",
  },
  plan: {
    delivery: "Entrega rápida",
    deliveryDesc: "La mayoría de los pedidos comienza en menos de 30 minutos tras confirmar el pago.",
    safe: "Sin contraseña",
    safeDesc: "Nunca pedimos la contraseña de tu cuenta. Solo necesitamos tu @ público o el enlace de la publicación.",
    refill: "Reposición garantizada",
    refillDesc: "Las bajas en los primeros 30 días se reponen sin coste.",
    support: "Soporte humano",
    supportDesc: "Personas reales contestando en tu idioma, no bots.",
    detailsTitle: "Qué incluye este paquete",
    whyTitle: "¿Por qué este paquete?",
    relatedTitle: "Otros paquetes de la misma categoría",
  },
};

// ---------- Français (fr) ----------
const fr: Pack = {
  home: {
    heroTitle: "Boostez votre Instagram et TikTok",
    heroSubtitle: "Abonnés, likes et vues avec livraison rapide. Payez en EUR, USD ou crypto.",
    plansByService: "Services",
    pickMarket: "Marchés et langues",
    pickService: "Choisissez un service",
    viewService: "Voir les détails",
  },
  header: {
    login: "Connexion",
    register: "Créer un compte",
    account: "Mon compte",
    support: "Support",
    logout: "Déconnexion",
    currency: "Devise",
    markets: "Marchés",
    searchPlaceholder: "Rechercher services et marchés…",
    searchNoResults: "Aucun résultat.",
    regionAmericas: "Amériques",
    regionSepa: "Europe / SEPA",
  },
  footer: {
    tagline: "Croissance responsable des réseaux sociaux.",
    sections: { legal: "Mentions", site: "Site", markets: "Marchés" },
    links: {
      privacy: "Politique de confidentialité",
      terms: "Conditions générales",
      cookies: "Politique de cookies",
      refund: "Politique de remboursement",
      contact: "Nous contacter",
      about: "À propos de Viralefy",
    },
    copyright: "Tous droits réservés.",
    disclaimer: "Viralefy n'est pas affilié à Instagram, TikTok ou Meta Platforms.",
  },
  cta: {
    buy: "Acheter",
    buyNow: "Acheter maintenant",
    seeAll: "Voir tous les forfaits",
    seeRange: "Voir la version avec curseur",
    seeCards: "Voir la version en cartes",
    backToHome: "Retour à l'accueil",
    backToCategory: "Retour à la catégorie",
  },
  category: {
    intro: "Choisissez un forfait",
    chooseQty: "Combien ?",
    suggested: "Forfait suggéré",
    total: "Total",
    perUnit: "par unité",
    compareAll: "Comparer tous les forfaits",
    table: { plan: "Forfait", qty: "Quantité", price: "Prix" },
    faq: "FAQ",
    breadcrumb: "Accueil",
    in: "en",
  },
  plan: {
    delivery: "Livraison rapide",
    deliveryDesc: "La plupart des commandes démarrent en moins de 30 minutes après confirmation du paiement.",
    safe: "Aucun mot de passe demandé",
    safeDesc: "Nous ne demandons jamais le mot de passe de votre compte. Donnez-nous votre @ public ou le lien de la publication.",
    refill: "Garantie de recharge",
    refillDesc: "Les pertes dans les 30 jours sont rechargées sans frais.",
    support: "Support humain",
    supportDesc: "De vraies personnes répondent dans votre langue, pas des bots.",
    detailsTitle: "Contenu du pack",
    whyTitle: "Pourquoi ce pack ?",
    relatedTitle: "Autres packs de la même catégorie",
  },
};

// ---------- Deutsch (de) ----------
const de: Pack = {
  home: {
    heroTitle: "Lassen Sie Instagram und TikTok wachsen",
    heroSubtitle: "Echte Follower, Engagement und Views — schnelle Lieferung. Zahlen Sie in EUR, USD oder Krypto.",
    plansByService: "Services",
    pickMarket: "Märkte und Sprachen",
    pickService: "Service wählen",
    viewService: "Details ansehen",
  },
  header: {
    login: "Anmelden",
    register: "Konto erstellen",
    account: "Mein Konto",
    support: "Support",
    logout: "Abmelden",
    currency: "Währung",
    markets: "Märkte",
    searchPlaceholder: "Services und Märkte suchen…",
    searchNoResults: "Keine Treffer.",
    regionAmericas: "Amerika",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Verantwortungsvolles Social-Media-Wachstum.",
    sections: { legal: "Rechtliches", site: "Website", markets: "Märkte" },
    links: {
      privacy: "Datenschutzerklärung",
      terms: "AGB",
      cookies: "Cookie-Richtlinie",
      refund: "Rückerstattungsrichtlinie",
      contact: "Kontakt",
      about: "Über Viralefy",
    },
    copyright: "Alle Rechte vorbehalten.",
    disclaimer: "Viralefy ist nicht mit Instagram, TikTok oder Meta Platforms verbunden.",
  },
  cta: {
    buy: "Kaufen",
    buyNow: "Jetzt kaufen",
    seeAll: "Alle Pakete anzeigen",
    seeRange: "Slider-Version anzeigen",
    seeCards: "Karten-Version anzeigen",
    backToHome: "Zurück zur Startseite",
    backToCategory: "Zurück zur Kategorie",
  },
  category: {
    intro: "Wähle ein Paket",
    chooseQty: "Wie viele?",
    suggested: "Empfohlenes Paket",
    total: "Gesamt",
    perUnit: "pro Einheit",
    compareAll: "Alle Pakete vergleichen",
    table: { plan: "Paket", qty: "Menge", price: "Preis" },
    faq: "FAQ",
    breadcrumb: "Start",
    in: "in",
  },
  plan: {
    delivery: "Schnelle Lieferung",
    deliveryDesc: "Die meisten Bestellungen starten innerhalb von 30 Minuten nach Zahlungsbestätigung.",
    safe: "Kein Passwort nötig",
    safeDesc: "Wir fragen niemals nach Ihrem Konto-Passwort. Geben Sie nur Ihr öffentliches @ oder den Beitrags-Link an.",
    refill: "Auffüll-Garantie",
    refillDesc: "Verluste innerhalb von 30 Tagen werden kostenlos aufgefüllt.",
    support: "Persönlicher Support",
    supportDesc: "Echte Menschen, die in Ihrer Sprache antworten — keine Bots.",
    detailsTitle: "Inhalt des Pakets",
    whyTitle: "Warum dieses Paket?",
    relatedTitle: "Andere Pakete der gleichen Kategorie",
  },
};

// ---------- Italiano (it) ----------
const it: Pack = {
  home: {
    heroTitle: "Fai crescere Instagram e TikTok",
    heroSubtitle: "Follower, like e visualizzazioni con consegna rapida. Paga in EUR, USD o cripto.",
    plansByService: "Servizi",
    pickMarket: "Mercati e lingue",
    pickService: "Scegli un servizio",
    viewService: "Vedi dettagli",
  },
  header: {
    login: "Accedi",
    register: "Crea account",
    account: "Il mio account",
    support: "Supporto",
    logout: "Esci",
    currency: "Valuta",
    markets: "Mercati",
    searchPlaceholder: "Cerca servizi e mercati…",
    searchNoResults: "Nessun risultato.",
    regionAmericas: "Americhe",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Crescita responsabile sui social.",
    sections: { legal: "Legale", site: "Sito", markets: "Mercati" },
    links: {
      privacy: "Informativa sulla privacy",
      terms: "Termini di servizio",
      cookies: "Politica sui cookie",
      refund: "Politica di rimborso",
      contact: "Contattaci",
      about: "Su Viralefy",
    },
    copyright: "Tutti i diritti riservati.",
    disclaimer: "Viralefy non è affiliata a Instagram, TikTok o Meta Platforms.",
  },
  cta: {
    buy: "Acquista",
    buyNow: "Acquista ora",
    seeAll: "Vedi tutti i pacchetti",
    seeRange: "Vedi versione con cursore",
    seeCards: "Vedi versione a schede",
    backToHome: "Torna alla home",
    backToCategory: "Torna alla categoria",
  },
  category: {
    intro: "Scegli un pacchetto",
    chooseQty: "Quanti?",
    suggested: "Pacchetto consigliato",
    total: "Totale",
    perUnit: "per unità",
    compareAll: "Confronta tutti i pacchetti",
    table: { plan: "Pacchetto", qty: "Quantità", price: "Prezzo" },
    faq: "FAQ",
    breadcrumb: "Home",
    in: "in",
  },
  plan: {
    delivery: "Consegna rapida",
    deliveryDesc: "La maggior parte degli ordini parte entro 30 minuti dalla conferma del pagamento.",
    safe: "Nessuna password",
    safeDesc: "Non chiediamo mai la password del tuo account. Basta il tuo @ pubblico o il link del post.",
    refill: "Garanzia di ricarica",
    refillDesc: "Le perdite entro 30 giorni vengono ricaricate senza costi.",
    support: "Supporto umano",
    supportDesc: "Persone reali che rispondono nella tua lingua, non bot.",
    detailsTitle: "Cosa include il pacchetto",
    whyTitle: "Perché questo pacchetto?",
    relatedTitle: "Altri pacchetti nella stessa categoria",
  },
};

// es_AR (voseo argentino) — pequena variação sobre `es`.
const es_AR: Pack = {
  ...es,
  home: { ...es.home, heroTitle: "Hacé crecer tu Instagram y TikTok", heroSubtitle: "Seguidores, interacciones y vistas con entrega rápida. Pagá en USD, EUR o cripto." },
  cta: { ...es.cta, buyNow: "Comprá ahora" },
};

// Catálogo completo. Para idiomas sem pacote rico aproveitamos `en` como
// fallback — mantém a página funcional e indexável; o conteúdo localizado
// real pode ser preenchido por idioma com merges parciais aqui.
export const PACKS: Record<LangCode, Pack> = {
  pt, en, es, es_AR, fr, de, it,
  // SEPA / outros idiomas — fallback temporário para en.
  // Sobrescritas curtas mantêm o label crítico do header/footer no idioma certo.
  nl: { ...en, home: { ...en.home, heroTitle: "Laat je Instagram en TikTok groeien" } },
  pl: { ...en, home: { ...en.home, heroTitle: "Rozwijaj Instagram i TikTok" } },
  sv: { ...en, home: { ...en.home, heroTitle: "Få ditt Instagram och TikTok att växa" } },
  da: { ...en, home: { ...en.home, heroTitle: "Lad dit Instagram og TikTok vokse" } },
  no: { ...en, home: { ...en.home, heroTitle: "La Instagram og TikTok vokse" } },
  fi: { ...en, home: { ...en.home, heroTitle: "Kasvata Instagramia ja TikTokia" } },
  is: { ...en, home: { ...en.home, heroTitle: "Stækkaðu Instagram og TikTok" } },
  et: { ...en },
  lv: { ...en },
  lt: { ...en },
  cs: { ...en },
  sk: { ...en },
  hu: { ...en },
  ro: { ...en },
  bg: { ...en },
  el: { ...en },
  hr: { ...en },
  sl: { ...en },
  ca: { ...es, home: { ...es.home, heroTitle: "Fes créixer el teu Instagram i TikTok" } },
};

export function tr(lang: LangCode): Pack {
  return PACKS[lang] ?? en;
}
