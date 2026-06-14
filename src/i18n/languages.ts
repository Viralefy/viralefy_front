// Pacote central de traduções. Os textos da UI ficam aqui indexados por
// "language family" (pt, en, es, …), enquanto `countries.ts` mantém o mapa
// país → idioma. Lookup com fallback para inglês: `tr(lang).header.login`.

export type LangCode =
  | "pt" | "en" | "es" | "es_AR" | "fr" | "de" | "it" | "nl"
  | "pl" | "sv" | "da" | "no" | "fi" | "is" | "et" | "lv" | "lt"
  | "cs" | "sk" | "hu" | "ro" | "bg" | "el" | "hr" | "sl" | "ca"
  // Ásia, África, Oceania, Europa-fora-SEPA
  | "ja" | "ko" | "ar" | "hi" | "id" | "vi" | "th" | "tr" | "uk"
  | "tl" | "ms" | "sr" | "sq" | "bs" | "fa" | "he" | "bn" | "ur"
  | "sw" | "am"
  // Russo (Rússia, Bielorrússia, Cazaquistão, Quirguistão e diáspora)
  | "ru";

// Mapa país → idioma. Para países sem entrada cai no inglês.
//
// NOTA sobre colisões ISO 3166 vs ISO 639:
//   - `sr` é Suriname (3166) E sérvio (639). Suriname continua mapeado pra
//     `nl`; Sérvia usa código de país `rs`, mapeado pra `sr`.
//   - `et` é Etiópia (3166) E estoniano (639). Etiópia mapeada pra `am`
//     (amárico); Estônia usa código de país `ee`, mapeado pra `et`.
//   - `id` é Indonésia (3166) E indonésio (639). Mesmo código pra ambos é OK.
const COUNTRY_LANG: Record<string, LangCode> = {
  // pt
  br: "pt", pt: "pt",
  // ru
  ru: "ru", by: "ru", kz: "ru", kg: "ru",
  // en (americas + sepa + caribbean + global default)
  us: "en", ca: "en", gb: "en", ie: "en", mt: "en", gi: "en",
  jm: "en", tt: "en", bs: "en", bb: "en", bz: "en", gy: "en",
  // anglofonos extras (Oceania, África subsahariana de tradição britânica, etc.)
  au: "en", nz: "en", fj: "en", pg: "en",
  za: "en", ng: "en", gh: "en", ug: "en",
  sg: "en", hk: "en", mo: "en", lk: "en", np: "en",
  // es (regional spanish — Argentina destaca-se com voseo)
  mx: "es", gt: "es", hn: "es", sv: "es", ni: "es", cr: "es", pa: "es",
  cu: "es", do: "es", pr: "es", es: "es",
  cl: "es", co: "es", ec: "es", ve: "es", pe: "es", bo: "es",
  py: "es", uy: "es", ar: "es_AR",
  // fr
  ht: "fr", fr: "fr", lu: "fr", mc: "fr",
  ci: "fr", cm: "fr", sn: "fr",
  // de
  de: "de", at: "de", ch: "de", li: "de",
  // it
  it: "it", sm: "it", va: "it",
  // nl
  nl: "nl", be: "nl", sr: "nl",
  // outros SEPA / Europa
  pl: "pl", se: "sv", dk: "da", no: "no", fi: "fi", is: "is",
  ee: "et", lv: "lv", lt: "lt",
  cz: "cs", sk: "sk", hu: "hu", ro: "ro", md: "ro", bg: "bg",
  gr: "el", cy: "el", hr: "hr", si: "sl", ad: "ca",
  // Europa não-SEPA / Balcãs / EX-URSS
  ua: "uk",
  rs: "sr", me: "sr",
  ba: "bs",
  al: "sq", xk: "sq", mk: "sq",
  tr: "tr",
  // Ásia Oriental
  jp: "ja", kr: "ko",
  tw: "en", // Mandarim ainda não tem Pack; cai em en
  // Sudeste Asiático
  id: "id",
  vn: "vi",
  th: "th",
  my: "ms", bn: "ms",
  ph: "tl",
  // Sul-Asiático
  in: "hi",
  pk: "ur",
  bd: "bn",
  // Oriente Médio
  il: "he",
  // Arábico
  sa: "ar", ae: "ar", qa: "ar", kw: "ar", bh: "ar", om: "ar",
  jo: "ar", lb: "ar", iq: "ar",
  eg: "ar", ma: "ar", dz: "ar", tn: "ar",
  // África subsahariana — Suaíli (Kenya/Tanzânia)
  ke: "sw", tz: "sw",
  // África subsahariana — Amárico (Etiópia)
  et: "am",
  // África restante sem Pack dedicado → inglês
  ao: "pt", mz: "pt",
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
    allServices?: string;
    searchPlaceholder: string;
    searchNoResults: string;
    regionAmericas: string;
    regionSepa: string;
  };
  // Opcional: idiomas que ainda não receberam tradução do checkout caem
  // no fallback de en automaticamente via tr(). Render usa
  // t.checkout?.x ?? englishFallback. Permite shipear tradução por idioma
  // sem precisar travar build até cobrir os 25 idiomas.
  checkout?: {
    completePurchase: string;
    choosePaymentMethod: string;
    completePayment: string;
    pickHowYouPay: string;
    pickAMethod: string;
    confirmPay: string;
    payWithCredits: string;
    continueChooseMethod: string;
    cancel: string;
    back: string;
    fullName: string;
    email: string;
    instagramHandle: string;
    tiktokHandle: string;
    promoCode: string;
    apply: string;
    checking: string;
    creatingOrder: string;
    couponNotFound: string;
    couponApplied: string;
    payWithCard: string;
    payWithPix: string;
    payWithCrypto: string;
    openStripe: string;
    alreadyPaid: string;
    receiptFile: string;
    receiptNote: string;
    skipUpload: string;
    pixCodeCopy: string;
    pixCodeCopied: string;
    // BUG-69 do QA: step de revisão entre form e method picker. Mostra
    // handle/quantidade/total/método antes do usuário avançar pro pagamento
    // pra eliminar cliques acidentais no submit.
    review: {
      title: string;
      handleLabel: string;
      totalLabel: string;
      confirmAndPay: string;
      back: string;
    };
    // BUG-29 do QA 2026-06-14: mensagens de erro por campo. Antes o form só
    // mostrava um alerta genérico no topo; agora cada campo invalido aparece
    // destacado em vermelho com a mensagem específica abaixo.
    fieldError?: {
      required: string;
      nameInvalid: string;
      emailInvalid: string;
      handleInvalid: string;
      publicationUrlInvalid: string;
      formSummary: string;
    };
  };
  notFound: {
    title: string;            // big hero
    description: string;      // sub-line
    browseAll: string;
    myAccount: string;
    signIn: string;
    createAccount: string;
    popularMarkets: string;
    viewAllMarkets: string;
    regionAmericas: string;
    regionSepa: string;
  };
  footer: {
    tagline: string;
    sections: { legal: string; site: string; markets: string; discover: string };
    links: {
      privacy: string;
      terms: string;
      cookies: string;
      refund: string;
      contact: string;
      about: string;
    };
    discover: {
      pricing: string;
      cities: string;
      compare: string;
      helpCenter: string;
      caseStudies: string;
      systemStatus: string;
      cookiePreferences: string;
      referAndEarn: string;
      subscriptions: string;
      developerApi: string;
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
    localPricing: string;     // "Preço local aplicado" badge PPP
  };
  plan: {
    delivery: string;         // "Entrega rápida"
    deliveryDesc: string;     // ex. "início em até 1 hora"
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
  // Selos curtos de confiança usados no hero/checkout (TrustSignals).
  trust: {
    refill: string;     // "30-day refill guarantee"
    password: string;   // "No password required"
    delivery: string;   // "Delivery starts from 1 hour"
    guarantee: string;  // "30-day guarantee" — versão badge
  };
  // Widget de contador "ao vivo" (LiveCounter).
  live: {
    ordersToday: string; // "orders today"
    lastHour: string;    // "in the last hour"
  };
};

// ---------- Pacote base (en-US) ----------
const en: Pack = {
  home: {
    heroTitle: "Grow your Instagram & TikTok",
    heroSubtitle: "Real followers, engagement and views with fast delivery. Pay in USDT, USD, EUR or crypto.",
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
    allServices: "Services",
    searchPlaceholder: "Search services and markets…",
    searchNoResults: "No matches.",
    regionAmericas: "Americas",
    regionSepa: "Europe / SEPA",
  },
  checkout: {
    completePurchase: "Complete purchase",
    choosePaymentMethod: "Choose payment method",
    completePayment: "Complete payment",
    pickHowYouPay: "Pick how you want to pay. The amount in your chosen method is shown below.",
    pickAMethod: "Pick a method first",
    confirmPay: "Confirm — pay",
    payWithCredits: "Pay with credits",
    continueChooseMethod: "Continue → choose method",
    cancel: "Cancel",
    back: "← Back",
    fullName: "Full name",
    email: "Email",
    instagramHandle: "@ on Instagram",
    tiktokHandle: "@ on TikTok",
    promoCode: "Promo code (optional)",
    apply: "Apply",
    checking: "Checking…",
    creatingOrder: "Creating order…",
    couponNotFound: "Coupon not found",
    couponApplied: "Coupon applied",
    payWithCard: "Pay with card",
    payWithPix: "Pay with Pix",
    payWithCrypto: "Pay with crypto",
    openStripe: "Open Stripe checkout →",
    alreadyPaid: "Already paid? Upload your proof",
    receiptFile: "Receipt file (image or PDF, max 5 MB)",
    receiptNote: "Note (transaction reference, time, etc.)",
    skipUpload: "Skip — I'll upload later",
    pixCodeCopy: "Copy Pix code",
    pixCodeCopied: "Copied!",
    review: {
      title: "Review your order",
      handleLabel: "Recipient",
      totalLabel: "Total",
      confirmAndPay: "Confirm and pay",
      back: "← Back",
    },
    fieldError: {
      required: "This field is required.",
      nameInvalid: "Enter your full name.",
      emailInvalid: "Enter a valid email address.",
      handleInvalid: "Use letters, numbers, dot or underscore (1–30 chars). No spaces.",
      publicationUrlInvalid: "Paste a valid post or video URL.",
      formSummary: "Please fix the highlighted fields and try again.",
    },
  },
  notFound: {
    title: "This page doesn't exist — but your next follower does.",
    description: "The content you were looking for is gone or never existed. Continue where most customers start:",
    browseAll: "Browse all services",
    myAccount: "My account",
    signIn: "Sign in",
    createAccount: "Create account",
    popularMarkets: "Popular markets",
    viewAllMarkets: "View all markets",
    regionAmericas: "Americas",
    regionSepa: "Europe / SEPA",
  },
  footer: {
    tagline: "Responsible social media growth.",
    sections: { legal: "Legal", site: "Site", markets: "Markets", discover: "Discover" },
    links: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      refund: "Refund Policy",
      contact: "Contact support",
      about: "About Viralefy",
    },
    discover: {
      pricing: "Pricing",
      cities: "Cities",
      compare: "Compare Viralefy",
      helpCenter: "Help center",
      caseStudies: "Case studies",
      systemStatus: "System status",
      cookiePreferences: "Cookie preferences",
      referAndEarn: "Refer & earn",
      subscriptions: "Subscriptions",
      developerApi: "Developer API",
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
    localPricing: "Local pricing applied",
  },
  plan: {
    delivery: "Fast delivery",
    deliveryDesc: "Most orders start from 1 hour after payment is confirmed.",
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
  trust: {
    refill: "30-day refill guarantee",
    password: "No password required",
    delivery: "Delivery starts from 1 hour",
    guarantee: "30-day guarantee",
  },
  live: {
    ordersToday: "orders today",
    lastHour: "in the last hour",
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
    allServices: "Serviços",
    searchPlaceholder: "Buscar serviços e mercados…",
    searchNoResults: "Nenhum resultado.",
    regionAmericas: "Américas",
    regionSepa: "Europa / SEPA",
  },
  checkout: {
    completePurchase: "Finalizar compra",
    choosePaymentMethod: "Escolha o método de pagamento",
    completePayment: "Conclua o pagamento",
    pickHowYouPay: "Escolha como quer pagar. O valor no método escolhido aparece abaixo.",
    pickAMethod: "Selecione um método primeiro",
    confirmPay: "Confirmar — pagar",
    payWithCredits: "Pagar com créditos",
    continueChooseMethod: "Continuar → escolher método",
    cancel: "Cancelar",
    back: "← Voltar",
    fullName: "Nome completo",
    email: "E-mail",
    instagramHandle: "@ do Instagram",
    tiktokHandle: "@ do TikTok",
    promoCode: "Cupom (opcional)",
    apply: "Aplicar",
    checking: "Verificando…",
    creatingOrder: "Criando pedido…",
    couponNotFound: "Cupom não encontrado",
    couponApplied: "Cupom aplicado",
    payWithCard: "Pagar com cartão",
    payWithPix: "Pagar com Pix",
    payWithCrypto: "Pagar com cripto",
    openStripe: "Abrir checkout Stripe →",
    alreadyPaid: "Já pagou? Envie o comprovante",
    receiptFile: "Comprovante (imagem ou PDF, até 5 MB)",
    receiptNote: "Observação (ID da transação, horário, etc.)",
    skipUpload: "Pular — envio depois",
    pixCodeCopy: "Copiar código Pix",
    pixCodeCopied: "Copiado!",
    review: {
      title: "Confira seu pedido",
      handleLabel: "Destinatário",
      totalLabel: "Total",
      confirmAndPay: "Confirmar e pagar",
      back: "← Voltar",
    },
    fieldError: {
      required: "Campo obrigatório.",
      nameInvalid: "Informe seu nome completo.",
      emailInvalid: "Informe um e-mail válido.",
      handleInvalid: "Use letras, números, ponto ou underline (1–30 caracteres). Sem espaços.",
      publicationUrlInvalid: "Cole a URL válida do post ou vídeo.",
      formSummary: "Corrija os campos destacados e tente novamente.",
    },
  },
  notFound: {
    title: "Essa página não existe — mas o seu próximo seguidor existe.",
    description: "O que você procurava saiu do ar ou nunca existiu. Continue pelos caminhos onde a maioria começa:",
    browseAll: "Ver todos os serviços",
    myAccount: "Minha conta",
    signIn: "Entrar",
    createAccount: "Criar conta",
    popularMarkets: "Mercados populares",
    viewAllMarkets: "Ver todos os mercados",
    regionAmericas: "Américas",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Crescimento responsável em redes sociais.",
    sections: { legal: "Jurídico", site: "Site", markets: "Mercados", discover: "Descubra" },
    links: {
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      cookies: "Política de Cookies",
      refund: "Política de Reembolso",
      contact: "Contato",
      about: "Sobre a Viralefy",
    },
    discover: {
      pricing: "Preços",
      cities: "Cidades",
      compare: "Comparar Viralefy",
      helpCenter: "Central de ajuda",
      caseStudies: "Estudos de caso",
      systemStatus: "Status do sistema",
      cookiePreferences: "Preferências de cookies",
      referAndEarn: "Indique e ganhe",
      subscriptions: "Assinaturas",
      developerApi: "API para desenvolvedor",
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
    localPricing: "Preço local aplicado",
  },
  plan: {
    delivery: "Entrega rápida",
    deliveryDesc: "A maioria dos pedidos começa em até 1 hora após a confirmação do pagamento.",
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
  trust: {
    refill: "Reposição garantida por 30 dias",
    password: "Sem precisar de senha",
    delivery: "Entrega começa em 1 hora",
    guarantee: "Garantia de 30 dias",
  },
  live: {
    ordersToday: "pedidos hoje",
    lastHour: "na última hora",
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
    allServices: "Servicios",
    searchPlaceholder: "Buscar servicios y mercados…",
    searchNoResults: "Sin resultados.",
    regionAmericas: "Américas",
    regionSepa: "Europa / SEPA",
  },
  notFound: {
    title: "Esta página no existe — pero tu próximo seguidor sí.",
    description: "Lo que buscabas no está o nunca existió. Sigue por donde la mayoría empieza:",
    browseAll: "Ver todos los servicios",
    myAccount: "Mi cuenta",
    signIn: "Iniciar sesión",
    createAccount: "Crear cuenta",
    popularMarkets: "Mercados populares",
    viewAllMarkets: "Ver todos los mercados",
    regionAmericas: "Américas",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Crecimiento responsable en redes sociales.",
    sections: { legal: "Legal", site: "Sitio", markets: "Mercados", discover: "Descubre" },
    links: {
      privacy: "Política de Privacidad",
      terms: "Términos de Servicio",
      cookies: "Política de Cookies",
      refund: "Política de Reembolso",
      contact: "Contacto",
      about: "Acerca de Viralefy",
    },
    discover: {
      pricing: "Precios",
      cities: "Ciudades",
      compare: "Comparar Viralefy",
      helpCenter: "Centro de ayuda",
      caseStudies: "Casos de éxito",
      systemStatus: "Estado del sistema",
      cookiePreferences: "Preferencias de cookies",
      referAndEarn: "Refiere y gana",
      subscriptions: "Suscripciones",
      developerApi: "API para desarrolladores",
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
    localPricing: "Precio local aplicado",
  },
  plan: {
    delivery: "Entrega rápida",
    deliveryDesc: "La mayoría de los pedidos comienza en menos de 1 hora tras confirmar el pago.",
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
  trust: {
    refill: "Reposición garantizada 30 días",
    password: "Sin contraseña",
    delivery: "La entrega comienza en 1 hora",
    guarantee: "Garantía de 30 días",
  },
  live: {
    ordersToday: "pedidos hoy",
    lastHour: "en la última hora",
  },
  checkout: {
    completePurchase: "Completar compra",
    choosePaymentMethod: "Elige método de pago",
    completePayment: "Completa el pago",
    pickHowYouPay: "Elige cómo quieres pagar. El importe en el método elegido aparece debajo.",
    pickAMethod: "Primero elige un método",
    confirmPay: "Confirmar — pagar",
    payWithCredits: "Pagar con créditos",
    continueChooseMethod: "Continuar → elegir método",
    cancel: "Cancelar",
    back: "← Volver",
    fullName: "Nombre completo",
    email: "Email",
    instagramHandle: "@ en Instagram",
    tiktokHandle: "@ en TikTok",
    promoCode: "Cupón (opcional)",
    apply: "Aplicar",
    checking: "Comprobando…",
    creatingOrder: "Creando pedido…",
    couponNotFound: "Cupón no encontrado",
    couponApplied: "Cupón aplicado",
    payWithCard: "Pagar con tarjeta",
    payWithPix: "Pagar con Pix",
    payWithCrypto: "Pagar con cripto",
    openStripe: "Abrir checkout Stripe →",
    alreadyPaid: "¿Ya pagaste? Sube tu comprobante",
    receiptFile: "Comprobante (imagen o PDF, máx. 5 MB)",
    receiptNote: "Nota (ID de transacción, hora, etc.)",
    skipUpload: "Omitir — lo subo después",
    pixCodeCopy: "Copiar código Pix",
    pixCodeCopied: "¡Copiado!",
    review: {
      title: "Revisa tu pedido",
      handleLabel: "Destinatario",
      totalLabel: "Total",
      confirmAndPay: "Confirmar y pagar",
      back: "← Volver",
    },
    fieldError: {
      required: "Este campo es obligatorio.",
      nameInvalid: "Ingresa tu nombre completo.",
      emailInvalid: "Ingresa un email válido.",
      handleInvalid: "Usa letras, números, punto o guion bajo (1–30 caracteres). Sin espacios.",
      publicationUrlInvalid: "Pega una URL válida del post o video.",
      formSummary: "Corrige los campos resaltados e inténtalo de nuevo.",
    },
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
    allServices: "Services",
    searchPlaceholder: "Rechercher services et marchés…",
    searchNoResults: "Aucun résultat.",
    regionAmericas: "Amériques",
    regionSepa: "Europe / SEPA",
  },
  notFound: {
    title: "Cette page n'existe pas — mais ton prochain abonné, si.",
    description: "Le contenu recherché n'est plus là ou n'a jamais existé. Continue par où la plupart commence :",
    browseAll: "Voir tous les services",
    myAccount: "Mon compte",
    signIn: "Connexion",
    createAccount: "Créer un compte",
    popularMarkets: "Marchés populaires",
    viewAllMarkets: "Voir tous les marchés",
    regionAmericas: "Amériques",
    regionSepa: "Europe / SEPA",
  },
  footer: {
    tagline: "Croissance responsable des réseaux sociaux.",
    sections: { legal: "Mentions", site: "Site", markets: "Marchés", discover: "Découvrir" },
    links: {
      privacy: "Politique de confidentialité",
      terms: "Conditions générales",
      cookies: "Politique de cookies",
      refund: "Politique de remboursement",
      contact: "Nous contacter",
      about: "À propos de Viralefy",
    },
    discover: {
      pricing: "Tarifs",
      cities: "Villes",
      compare: "Comparer Viralefy",
      helpCenter: "Centre d'aide",
      caseStudies: "Études de cas",
      systemStatus: "État du système",
      cookiePreferences: "Préférences cookies",
      referAndEarn: "Parrainez et gagnez",
      subscriptions: "Abonnements",
      developerApi: "API développeur",
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
    localPricing: "Tarif local appliqué",
  },
  plan: {
    delivery: "Livraison rapide",
    deliveryDesc: "La plupart des commandes démarrent en moins d'1 heure après confirmation du paiement.",
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
  trust: {
    refill: "Garantie de recharge 30 jours",
    password: "Aucun mot de passe requis",
    delivery: "Livraison sous 1 heure",
    guarantee: "Garantie 30 jours",
  },
  live: {
    ordersToday: "commandes aujourd'hui",
    lastHour: "dans la dernière heure",
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
    allServices: "Dienste",
    searchPlaceholder: "Dienste und Märkte suchen…",
    searchNoResults: "Keine Treffer.",
    regionAmericas: "Amerika",
    regionSepa: "Europa / SEPA",
  },
  notFound: {
    title: "Diese Seite gibt es nicht — deinen nächsten Follower aber schon.",
    description: "Der gesuchte Inhalt ist weg oder existierte nie. Mach da weiter, wo die meisten anfangen:",
    browseAll: "Alle Services ansehen",
    myAccount: "Mein Konto",
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    popularMarkets: "Beliebte Märkte",
    viewAllMarkets: "Alle Märkte ansehen",
    regionAmericas: "Amerika",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Verantwortungsvolles Social-Media-Wachstum.",
    sections: { legal: "Rechtliches", site: "Website", markets: "Märkte", discover: "Entdecken" },
    links: {
      privacy: "Datenschutzerklärung",
      terms: "AGB",
      cookies: "Cookie-Richtlinie",
      refund: "Rückerstattungsrichtlinie",
      contact: "Kontakt",
      about: "Über Viralefy",
    },
    discover: {
      pricing: "Preise",
      cities: "Städte",
      compare: "Viralefy vergleichen",
      helpCenter: "Hilfe-Center",
      caseStudies: "Fallstudien",
      systemStatus: "Systemstatus",
      cookiePreferences: "Cookie-Einstellungen",
      referAndEarn: "Empfehlen & verdienen",
      subscriptions: "Abonnements",
      developerApi: "Entwickler-API",
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
    localPricing: "Lokaler Preis angewendet",
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
  trust: {
    refill: "30 Tage Auffüll-Garantie",
    password: "Kein Passwort nötig",
    delivery: "Lieferung startet in 30 Minuten",
    guarantee: "30-Tage-Garantie",
  },
  live: {
    ordersToday: "Bestellungen heute",
    lastHour: "in der letzten Stunde",
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
  notFound: {
    title: "Questa pagina non esiste — ma il tuo prossimo follower sì.",
    description: "Il contenuto cercato non c'è più o non è mai esistito. Continua da dove inizia la maggior parte:",
    browseAll: "Tutti i servizi",
    myAccount: "Il mio account",
    signIn: "Accedi",
    createAccount: "Crea account",
    popularMarkets: "Mercati popolari",
    viewAllMarkets: "Tutti i mercati",
    regionAmericas: "Americhe",
    regionSepa: "Europa / SEPA",
  },
  footer: {
    tagline: "Crescita responsabile sui social.",
    sections: { legal: "Legale", site: "Sito", markets: "Mercati", discover: "Scopri" },
    links: {
      privacy: "Informativa sulla privacy",
      terms: "Termini di servizio",
      cookies: "Politica sui cookie",
      refund: "Politica di rimborso",
      contact: "Contattaci",
      about: "Su Viralefy",
    },
    discover: {
      pricing: "Prezzi",
      cities: "Città",
      compare: "Confronta Viralefy",
      helpCenter: "Centro assistenza",
      caseStudies: "Casi studio",
      systemStatus: "Stato del sistema",
      cookiePreferences: "Preferenze cookie",
      referAndEarn: "Invita e guadagna",
      subscriptions: "Abbonamenti",
      developerApi: "API per sviluppatori",
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
    localPricing: "Prezzo locale applicato",
    in: "in",
  },
  plan: {
    delivery: "Consegna rapida",
    deliveryDesc: "La maggior parte degli ordini parte entro 1 ora dalla conferma del pagamento.",
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
  trust: {
    refill: "Garanzia di ricarica 30 giorni",
    password: "Nessuna password richiesta",
    delivery: "Consegna in 1 ora",
    guarantee: "Garanzia 30 giorni",
  },
  live: {
    ordersToday: "ordini oggi",
    lastHour: "nell'ultima ora",
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
  nl: {
    ...en,
    home: { ...en.home, heroTitle: "Laat je Instagram en TikTok groeien", plansByService: "Diensten" },
    header: { ...en.header, login: "Inloggen", register: "Account aanmaken", account: "Mijn account", support: "Ondersteuning", logout: "Uitloggen", currency: "Valuta", markets: "Markten", allServices: "Diensten", searchPlaceholder: "Zoek diensten en markten…", searchNoResults: "Geen resultaten." },
    trust: {
      refill: "30 dagen aanvulgarantie",
      password: "Geen wachtwoord nodig",
      delivery: "Levering start in 1 uur",
      guarantee: "30 dagen garantie",
    },
    live: {
      ordersToday: "bestellingen vandaag",
      lastHour: "in het laatste uur",
    },
  },
  pl: {
    ...en,
    home: { ...en.home, heroTitle: "Rozwijaj Instagram i TikTok", plansByService: "Usługi" },
    header: { ...en.header, login: "Zaloguj się", register: "Załóż konto", account: "Moje konto", support: "Wsparcie", logout: "Wyloguj", currency: "Waluta", markets: "Rynki", allServices: "Usługi", searchPlaceholder: "Szukaj usług i rynków…", searchNoResults: "Brak wyników.", regionAmericas: "Ameryki" },
  },
  sv: {
    ...en,
    home: { ...en.home, heroTitle: "Få ditt Instagram och TikTok att växa", plansByService: "Tjänster" },
    header: { ...en.header, login: "Logga in", register: "Skapa konto", account: "Mitt konto", support: "Support", logout: "Logga ut", currency: "Valuta", markets: "Marknader", allServices: "Tjänster", searchPlaceholder: "Sök tjänster och marknader…", searchNoResults: "Inga träffar." },
  },
  da: {
    ...en,
    home: { ...en.home, heroTitle: "Lad dit Instagram og TikTok vokse", plansByService: "Tjenester" },
    header: { ...en.header, login: "Log ind", register: "Opret konto", account: "Min konto", support: "Support", logout: "Log ud", currency: "Valuta", markets: "Markeder", allServices: "Tjenester", searchPlaceholder: "Søg tjenester og markeder…", searchNoResults: "Ingen resultater." },
  },
  no: {
    ...en,
    home: { ...en.home, heroTitle: "La Instagram og TikTok vokse", plansByService: "Tjenester" },
    header: { ...en.header, login: "Logg inn", register: "Opprett konto", account: "Min konto", support: "Support", logout: "Logg ut", currency: "Valuta", markets: "Markeder", allServices: "Tjenester", searchPlaceholder: "Søk tjenester og markeder…", searchNoResults: "Ingen treff." },
  },
  fi: {
    ...en,
    home: { ...en.home, heroTitle: "Kasvata Instagramia ja TikTokia", plansByService: "Palvelut" },
    header: { ...en.header, login: "Kirjaudu", register: "Luo tili", account: "Tili", support: "Tuki", logout: "Kirjaudu ulos", currency: "Valuutta", markets: "Markkinat", allServices: "Palvelut", searchPlaceholder: "Etsi palveluja ja markkinoita…", searchNoResults: "Ei tuloksia." },
  },
  is: {
    ...en,
    home: { ...en.home, heroTitle: "Stækkaðu Instagram og TikTok", plansByService: "Þjónustur" },
    header: { ...en.header, login: "Innskrá", register: "Stofna reikning", account: "Reikningurinn minn", support: "Stuðningur", logout: "Útskrá", currency: "Mynt", markets: "Markaðir", allServices: "Þjónustur", searchPlaceholder: "Leita að þjónustum og mörkuðum…", searchNoResults: "Engar niðurstöður." },
  },
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
  // ---------- Ásia ----------
  // BUG-193/194 do QA 2026-06-14: páginas /jp e /kr mostravam 109+ botões
  // "Buy now" em inglês mesmo com toda nav e categorias em japonês/coreano.
  // O override `...en` herdava cta.buyNow="Buy now" porque só home/header
  // tinham overrides; cta caía no fallback EN. Adicionamos cta completo
  // (buyNow, buy, seeAll, backToHome, backToCategory) em jp/kr/ar/hi/id/vi/
  // th/tr/uk para que os CTAs do CategoryCardGrid/CategoryGroupedGrid/
  // QuantitySlider/BuyPlanCta saiam no idioma local.
  ja: {
    ...en,
    home: { ...en.home, heroTitle: "Instagram と TikTok を成長させる", heroSubtitle: "本物のフォロワー、エンゲージメント、ビューを高速配信。USD、EUR、暗号通貨で支払い可能。", plansByService: "サービス", pickService: "サービスを選択", viewService: "詳細を見る" },
    header: { ...en.header, login: "ログイン", register: "アカウント作成", account: "マイアカウント", support: "サポート", logout: "ログアウト", currency: "通貨", markets: "市場", allServices: "サービス", searchPlaceholder: "サービスや市場を検索…", searchNoResults: "結果なし。" },
    cta: { ...en.cta, buy: "購入", buyNow: "今すぐ購入", seeAll: "すべてのプランを見る", backToHome: "ホームに戻る", backToCategory: "カテゴリーに戻る" },
  },
  ko: {
    ...en,
    home: { ...en.home, heroTitle: "Instagram과 TikTok 성장시키기", heroSubtitle: "진짜 팔로워, 좋아요, 조회수를 빠르게 배송. USD, EUR 또는 암호화폐로 결제.", plansByService: "서비스", pickService: "서비스 선택", viewService: "상세 보기" },
    header: { ...en.header, login: "로그인", register: "계정 만들기", account: "내 계정", support: "지원", logout: "로그아웃", currency: "통화", markets: "마켓", allServices: "서비스", searchPlaceholder: "서비스 및 시장 검색…", searchNoResults: "결과 없음." },
    cta: { ...en.cta, buy: "구매", buyNow: "지금 구매", seeAll: "모든 플랜 보기", backToHome: "홈으로", backToCategory: "카테고리로" },
  },
  ar: {
    ...en,
    home: { ...en.home, heroTitle: "نمِّ حساب Instagram و TikTok", heroSubtitle: "متابعين حقيقيون، تفاعل ومشاهدات بتسليم سريع. ادفع بالدولار الأمريكي أو اليورو أو العملات المشفرة.", plansByService: "الخدمات", pickService: "اختر خدمة", viewService: "عرض التفاصيل" },
    header: { ...en.header, login: "تسجيل الدخول", register: "إنشاء حساب", account: "حسابي", support: "الدعم", logout: "تسجيل الخروج", currency: "العملة", markets: "الأسواق", allServices: "الخدمات", searchPlaceholder: "ابحث عن الخدمات والأسواق…", searchNoResults: "لا توجد نتائج." },
    cta: { ...en.cta, buy: "شراء", buyNow: "اشترِ الآن", seeAll: "عرض كل الباقات", backToHome: "العودة للرئيسية", backToCategory: "العودة للفئة" },
  },
  hi: {
    ...en,
    home: { ...en.home, heroTitle: "अपना Instagram और TikTok बढ़ाएं", heroSubtitle: "असली फॉलोअर्स, एंगेजमेंट और व्यूज़ — तेज़ डिलीवरी। USD, EUR या क्रिप्टो से भुगतान करें।", plansByService: "सेवाएँ", pickService: "सेवा चुनें", viewService: "विवरण देखें" },
    header: { ...en.header, login: "लॉग इन", register: "खाता बनाएँ", account: "मेरा खाता", support: "सहायता", logout: "लॉग आउट", currency: "मुद्रा", markets: "बाज़ार", allServices: "सेवाएँ", searchPlaceholder: "सेवाएँ और बाज़ार खोजें…", searchNoResults: "कोई परिणाम नहीं।" },
    cta: { ...en.cta, buy: "खरीदें", buyNow: "अभी खरीदें", seeAll: "सभी प्लान देखें", backToHome: "होम पर वापस", backToCategory: "श्रेणी पर वापस" },
  },
  id: {
    ...en,
    home: { ...en.home, heroTitle: "Kembangkan Instagram dan TikTok Anda", heroSubtitle: "Pengikut asli, engagement, dan tayangan dengan pengiriman cepat. Bayar dalam USD, EUR, atau kripto.", plansByService: "Layanan", pickService: "Pilih layanan", viewService: "Lihat detail" },
    header: { ...en.header, login: "Masuk", register: "Buat akun", account: "Akun saya", support: "Dukungan", logout: "Keluar", currency: "Mata uang", markets: "Pasar", allServices: "Layanan", searchPlaceholder: "Cari layanan dan pasar…", searchNoResults: "Tidak ada hasil." },
    cta: { ...en.cta, buy: "Beli", buyNow: "Beli sekarang", seeAll: "Lihat semua paket", backToHome: "Kembali ke beranda", backToCategory: "Kembali ke kategori" },
  },
  vi: {
    ...en,
    home: { ...en.home, heroTitle: "Phát triển Instagram và TikTok của bạn", heroSubtitle: "Người theo dõi thật, tương tác và lượt xem giao nhanh. Thanh toán bằng USD, EUR hoặc tiền điện tử.", plansByService: "Dịch vụ", pickService: "Chọn dịch vụ", viewService: "Xem chi tiết" },
    header: { ...en.header, login: "Đăng nhập", register: "Tạo tài khoản", account: "Tài khoản", support: "Hỗ trợ", logout: "Đăng xuất", currency: "Tiền tệ", markets: "Thị trường", allServices: "Dịch vụ", searchPlaceholder: "Tìm dịch vụ và thị trường…", searchNoResults: "Không có kết quả." },
    cta: { ...en.cta, buy: "Mua", buyNow: "Mua ngay", seeAll: "Xem tất cả gói", backToHome: "Về trang chủ", backToCategory: "Về danh mục" },
  },
  th: {
    ...en,
    home: { ...en.home, heroTitle: "เติบโตบน Instagram และ TikTok", heroSubtitle: "ผู้ติดตามจริง การมีส่วนร่วม และการดูที่ส่งมอบเร็ว ชำระด้วย USD, EUR หรือคริปโต", plansByService: "บริการ", pickService: "เลือกบริการ", viewService: "ดูรายละเอียด" },
    header: { ...en.header, login: "เข้าสู่ระบบ", register: "สร้างบัญชี", account: "บัญชีของฉัน", support: "ฝ่ายสนับสนุน", logout: "ออกจากระบบ", currency: "สกุลเงิน", markets: "ตลาด", allServices: "บริการ", searchPlaceholder: "ค้นหาบริการและตลาด…", searchNoResults: "ไม่พบผลลัพธ์" },
    cta: { ...en.cta, buy: "ซื้อ", buyNow: "ซื้อตอนนี้", seeAll: "ดูแพ็กเกจทั้งหมด", backToHome: "กลับหน้าแรก", backToCategory: "กลับหมวดหมู่" },
  },
  tr: {
    ...en,
    home: { ...en.home, heroTitle: "Instagram ve TikTok'unu büyüt", heroSubtitle: "Gerçek takipçi, etkileşim ve görüntüleme hızlı teslimat ile. USD, EUR veya kripto ile öde.", plansByService: "Hizmetler", pickService: "Bir hizmet seç", viewService: "Detayları gör" },
    header: { ...en.header, login: "Giriş yap", register: "Hesap oluştur", account: "Hesabım", support: "Destek", logout: "Çıkış", currency: "Para birimi", markets: "Pazarlar", allServices: "Hizmetler", searchPlaceholder: "Hizmet ve pazar ara…", searchNoResults: "Sonuç yok." },
    cta: { ...en.cta, buy: "Satın al", buyNow: "Şimdi satın al", seeAll: "Tüm paketleri gör", backToHome: "Ana sayfaya dön", backToCategory: "Kategoriye dön" },
  },
  // ---------- Europa-fora-SEPA ----------
  uk: {
    ...en,
    home: { ...en.home, heroTitle: "Розвивайте Instagram і TikTok", heroSubtitle: "Справжні підписники, активність і перегляди зі швидкою доставкою. Оплата в USD, EUR або криптовалюті.", plansByService: "Послуги" },
    header: { ...en.header, login: "Увійти", register: "Створити акаунт", account: "Мій акаунт", support: "Підтримка", logout: "Вийти", currency: "Валюта", markets: "Ринки", allServices: "Послуги", searchPlaceholder: "Пошук послуг і ринків…", searchNoResults: "Немає результатів." },
  },
  sr: { ...en, home: { ...en.home, heroTitle: "Развијте Instagram и TikTok" } },
  sq: { ...en, home: { ...en.home, heroTitle: "Rritni Instagram dhe TikTok" } },
  bs: { ...en, home: { ...en.home, heroTitle: "Razvijte Instagram i TikTok" } },
  // ---------- Outros ----------
  tl: { ...en, home: { ...en.home, heroTitle: "Palaguin ang iyong Instagram at TikTok" } },
  ms: { ...en, home: { ...en.home, heroTitle: "Kembangkan Instagram dan TikTok anda" } },
  fa: { ...en, home: { ...en.home, heroTitle: "Instagram و TikTok خود را رشد دهید" } },
  he: { ...en, home: { ...en.home, heroTitle: "הצמיחו את Instagram ו-TikTok שלכם" } },
  bn: { ...en, home: { ...en.home, heroTitle: "আপনার Instagram এবং TikTok বাড়ান" } },
  ur: { ...en, home: { ...en.home, heroTitle: "اپنا Instagram اور TikTok بڑھائیں" } },
  sw: { ...en, home: { ...en.home, heroTitle: "Kuza Instagram na TikTok yako" } },
  am: { ...en, home: { ...en.home, heroTitle: "Instagram እና TikTok ያሳድጉ" } },
  // ---------- Russo (rico) ----------
  ru: {
    home: {
      heroTitle: "Развивайте Instagram и TikTok",
      heroSubtitle: "Настоящие подписчики, активность и просмотры с быстрой доставкой. Оплата в USD, EUR или криптовалюте.",
      plansByService: "Услуги",
      pickMarket: "Рынки и языки",
      pickService: "Выбрать услугу",
      viewService: "Подробнее",
    },
    header: {
      login: "Войти",
      register: "Создать аккаунт",
      account: "Мой аккаунт",
      support: "Поддержка",
      logout: "Выйти",
      currency: "Валюта",
      markets: "Рынки",
      searchPlaceholder: "Поиск услуг и рынков…",
      searchNoResults: "Ничего не найдено.",
      regionAmericas: "Америка",
      regionSepa: "Европа / SEPA",
    },
    notFound: {
      title: "Этой страницы нет — но ваш следующий подписчик есть.",
      description: "Контент, который вы искали, исчез или никогда не существовал. Продолжите там, где начинает большинство:",
      browseAll: "Все услуги",
      myAccount: "Мой аккаунт",
      signIn: "Войти",
      createAccount: "Создать аккаунт",
      popularMarkets: "Популярные рынки",
      viewAllMarkets: "Все рынки",
      regionAmericas: "Америка",
      regionSepa: "Европа / SEPA",
    },
    footer: {
      tagline: "Ответственный рост в социальных сетях.",
      sections: { legal: "Правовое", site: "Сайт", markets: "Рынки", discover: "Откройте" },
      links: {
        privacy: "Политика конфиденциальности",
        terms: "Условия использования",
        cookies: "Политика cookies",
        refund: "Политика возврата",
        contact: "Поддержка",
        about: "О Viralefy",
      },
      discover: {
        pricing: "Цены",
        cities: "Города",
        compare: "Сравнить Viralefy",
        helpCenter: "Центр помощи",
        caseStudies: "Кейсы",
        systemStatus: "Статус системы",
        cookiePreferences: "Настройки cookie",
        referAndEarn: "Реферал — зарабатывайте",
        subscriptions: "Подписки",
        developerApi: "API для разработчиков",
      },
      copyright: "Все права защищены.",
      disclaimer: "Viralefy не аффилирована с Instagram, TikTok или Meta Platforms.",
    },
    cta: {
      buy: "Купить",
      buyNow: "Купить сейчас",
      seeAll: "Все пакеты",
      seeRange: "Версия со слайдером",
      seeCards: "Версия с карточками",
      backToHome: "На главную",
      backToCategory: "К категории",
    },
    category: {
      intro: "Выберите пакет",
      chooseQty: "Сколько?",
      suggested: "Рекомендуемый пакет",
      total: "Итого",
      perUnit: "за единицу",
      compareAll: "Сравнить все пакеты",
      table: { plan: "Пакет", qty: "Количество", price: "Цена" },
      faq: "Часто задаваемые вопросы",
      breadcrumb: "Главная",
      in: "в",
      localPricing: "Локальная цена применена",
    },
    plan: {
      delivery: "Быстрая доставка",
      deliveryDesc: "Большинство заказов начинаются в течение 30 минут после подтверждения оплаты.",
      safe: "Без пароля",
      safeDesc: "Мы никогда не запрашиваем пароль вашей учётной записи. Достаточно публичного @ или ссылки на пост.",
      refill: "Гарантия восполнения",
      refillDesc: "Отписки в течение 30 дней восполняются бесплатно.",
      support: "Живая поддержка",
      supportDesc: "Реальные люди отвечают на тикеты на вашем языке.",
      detailsTitle: "Содержимое пакета",
      whyTitle: "Почему этот пакет?",
      relatedTitle: "Другие пакеты этой категории",
    },
    trust: {
      refill: "Гарантия восполнения 30 дней",
      password: "Без пароля",
      delivery: "Доставка начинается за 30 минут",
      guarantee: "Гарантия 30 дней",
    },
    live: {
      ordersToday: "заказов сегодня",
      lastHour: "за последний час",
    },
  },
};

export function tr(lang: LangCode): Pack {
  const pack = PACKS[lang] ?? en;
  // Subbloco `checkout` é opcional por idioma (rolling translation). Se o
  // pack atual não tem, usa o de en pra que o consumer nunca veja undefined.
  if (!pack.checkout) {
    return { ...pack, checkout: en.checkout };
  }
  return pack;
}
