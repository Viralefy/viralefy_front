// Catálogo de categorias com slug SEO por idioma e cópia longa por idioma.
// O `code` é o mesmo do backend (`seguidores`, `engajamento`, …). O slug
// muda por idioma para casar com o vocabulário do mercado — pt usa
// "seguidores", en usa "followers", de usa "follower", etc.
//
// A cópia longa precisa entregar 500+ palavras por idioma. Onde não temos
// tradução dedicada caímos no `en`. Isso casa com `languages.ts`.

import type { LangCode } from "./languages";

export type CategoryCode = "seguidores" | "engajamento" | "visualizacoes" | "servicos";

export const CATEGORY_CODES: CategoryCode[] = [
  "seguidores", "engajamento", "visualizacoes", "servicos",
];

// Label curto (usado em chips / tabs)
export const CATEGORY_LABEL: Record<CategoryCode, Partial<Record<LangCode, string>>> = {
  seguidores: {
    en: "Followers", pt: "Seguidores", es: "Seguidores", es_AR: "Seguidores",
    fr: "Abonnés", de: "Follower", it: "Follower", nl: "Volgers",
    pl: "Obserwujący", sv: "Följare", da: "Følgere", no: "Følgere",
    fi: "Seuraajat", is: "Fylgjendur", et: "Jälgijad", lv: "Sekotāji", lt: "Sekėjai",
    cs: "Sledující", sk: "Sledovatelia", hu: "Követők", ro: "Urmăritori",
    bg: "Последователи", el: "Ακόλουθοι", hr: "Pratitelji", sl: "Sledilci", ca: "Seguidors",
  },
  engajamento: {
    en: "Likes & Engagement", pt: "Curtidas e engajamento",
    es: "Likes y engagement", es_AR: "Likes y engagement",
    fr: "Likes et engagement", de: "Likes & Engagement",
    it: "Like e engagement", nl: "Likes & engagement",
    pl: "Polubienia", sv: "Gilla-markeringar", da: "Likes", no: "Likes",
    fi: "Tykkäykset", is: "Líkar", et: "Meeldimised", lv: "Patīk", lt: "Patiktukai",
    cs: "Lajky", sk: "Lajky", hu: "Lájkok", ro: "Aprecieri",
    bg: "Харесвания", el: "Likes", hr: "Lajkovi", sl: "Všečki", ca: "M'agrada",
  },
  visualizacoes: {
    en: "Views", pt: "Visualizações", es: "Visualizaciones", es_AR: "Visualizaciones",
    fr: "Vues", de: "Aufrufe", it: "Visualizzazioni", nl: "Weergaven",
    pl: "Wyświetlenia", sv: "Visningar", da: "Visninger", no: "Visninger",
    fi: "Katselut", is: "Áhorf", et: "Vaatamised", lv: "Skatījumi", lt: "Peržiūros",
    cs: "Zhlédnutí", sk: "Zhliadnutia", hu: "Megtekintések", ro: "Vizualizări",
    bg: "Гледания", el: "Προβολές", hr: "Pregledi", sl: "Ogledi", ca: "Visualitzacions",
  },
  servicos: {
    en: "Premium services", pt: "Serviços premium", es: "Servicios premium",
    es_AR: "Servicios premium", fr: "Services premium", de: "Premium-Services",
    it: "Servizi premium", nl: "Premium diensten", pl: "Usługi premium",
    sv: "Premiumtjänster", da: "Premium-tjenester", no: "Premium-tjenester",
    fi: "Premium-palvelut", is: "Premium þjónusta",
    et: "Premium teenused", lv: "Premium pakalpojumi", lt: "Premium paslaugos",
    cs: "Prémiové služby", sk: "Prémiové služby", hu: "Prémium szolgáltatások",
    ro: "Servicii premium", bg: "Премиум услуги", el: "Premium υπηρεσίες",
    hr: "Premium usluge", sl: "Premium storitve", ca: "Serveis premium",
  },
};

// Slug SEO da categoria por idioma. Cai no inglês (= "followers") se faltar.
export const CATEGORY_SLUG: Record<CategoryCode, Partial<Record<LangCode, string>>> = {
  seguidores: {
    en: "followers", pt: "seguidores", es: "seguidores", es_AR: "seguidores",
    fr: "abonnes", de: "follower", it: "follower", nl: "volgers",
    pl: "obserwujacy", sv: "foljare", da: "folgere", no: "folgere",
    fi: "seuraajat", is: "fylgjendur", et: "jalgijad", lv: "sekotaji", lt: "sekejai",
    cs: "sledujici", sk: "sledovatelia", hu: "kovetok", ro: "urmaritori",
    bg: "posledovateli", el: "akoloutoi", hr: "pratitelji", sl: "sledilci", ca: "seguidors",
  },
  engajamento: {
    en: "likes", pt: "curtidas", es: "likes", es_AR: "likes",
    fr: "likes", de: "likes", it: "like", nl: "likes",
    pl: "polubienia", sv: "gillamarkeringar", da: "likes", no: "likes",
    fi: "tykkaykset", is: "likar", et: "meeldimised", lv: "patik", lt: "patiktukai",
    cs: "lajky", sk: "lajky", hu: "lajkok", ro: "aprecieri",
    bg: "haresvaniya", el: "likes", hr: "lajkovi", sl: "vsecki", ca: "magrada",
  },
  visualizacoes: {
    en: "views", pt: "visualizacoes", es: "visualizaciones", es_AR: "visualizaciones",
    fr: "vues", de: "aufrufe", it: "visualizzazioni", nl: "weergaven",
    pl: "wyswietlenia", sv: "visningar", da: "visninger", no: "visninger",
    fi: "katselut", is: "ahorf", et: "vaatamised", lv: "skatijumi", lt: "perziuros",
    cs: "zhlednuti", sk: "zhliadnutia", hu: "megtekintesek", ro: "vizualizari",
    bg: "gledaniya", el: "provoles", hr: "pregledi", sl: "ogledi", ca: "visualitzacions",
  },
  servicos: {
    en: "services", pt: "servicos", es: "servicios", es_AR: "servicios",
    fr: "services", de: "services", it: "servizi", nl: "diensten",
    pl: "uslugi", sv: "tjanster", da: "tjenester", no: "tjenester",
    fi: "palvelut", is: "thjonusta", et: "teenused", lv: "pakalpojumi", lt: "paslaugos",
    cs: "sluzby", sk: "sluzby", hu: "szolgaltatasok", ro: "servicii",
    bg: "uslugi", el: "ipiresies", hr: "usluge", sl: "storitve", ca: "serveis",
  },
};

// Resolve um slug recebido na URL → CategoryCode + idioma esperado.
// Faz a busca reversa em todos os idiomas para aceitar `seguidores` (pt) ou
// `followers` (en) na mesma roteamento.
export function categoryFromSlug(slug: string): CategoryCode | undefined {
  const s = slug.toLowerCase();
  for (const code of CATEGORY_CODES) {
    for (const lang of Object.keys(CATEGORY_SLUG[code]) as LangCode[]) {
      if (CATEGORY_SLUG[code][lang] === s) return code;
    }
  }
  return undefined;
}

export function categorySlug(code: CategoryCode, lang: LangCode): string {
  return CATEGORY_SLUG[code][lang] ?? CATEGORY_SLUG[code].en ?? code;
}

export function categoryLabel(code: CategoryCode, lang: LangCode): string {
  return CATEGORY_LABEL[code][lang] ?? CATEGORY_LABEL[code].en ?? code;
}

// ---------- Cópia longa (500+ palavras) por categoria e idioma ----------
// As funções aceitam o nome do país para interpolar no texto e tornar cada
// página única o suficiente (variantes mercado-a-mercado). Estrutura:
//   `intro` (parágrafo 1) — gancho;
//   `body` (parágrafos 2–4) — proposta de valor, detalhes, dúvidas;
//   `faq` — 4–6 perguntas/respostas curtas (rich snippet).

export type LongCopy = {
  h1: (countryName: string) => string;
  metaTitle: (countryName: string) => string;
  metaDescription: (countryName: string) => string;
  paragraphs: (countryName: string) => string[]; // cada item vira <p>
  bullets: () => { title: string; body: string }[];
  faq: () => { q: string; a: string }[];
};

// -------- seguidores (en) --------
const COPY_SEGUIDORES_EN: LongCopy = {
  h1: (c) => `Buy Instagram & TikTok followers in ${c}`,
  metaTitle: (c) => `Buy Instagram & TikTok followers in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Buy real followers for Instagram and TikTok in ${c}. Fast delivery, refill guarantee, support in your language. Pay in USD, EUR or crypto.`,
  paragraphs: (c) => [
    `Building an audience from scratch in ${c} is hard. The algorithms behind Instagram and TikTok favor accounts that already look "alive" — accounts with a steady follower count, recurring likes and a baseline of views. New profiles get caught in a chicken-and-egg loop: nobody discovers you because you have no traction, and you have no traction because nobody discovers you. Buying a starter pack of followers is the most direct way to break that loop and put your content in front of a wider reach pool.`,
    `Viralefy ships followers that survive: high-quality profiles drip-fed at a natural pace so the platform never flags your account as buying. Every package is delivered with a refill guarantee — if anyone drops within 30 days we top your count back up at no cost. Our orders for ${c} start within 30 minutes of payment confirmation and complete within 24 to 72 hours depending on the volume, with no need to share your password. All we ask is your public @ handle.`,
    `Compared with shady storefronts that drop thousands of bots overnight, Viralefy works in pacing windows that mimic organic growth. A 1,000-follower order is split across several hours; a 10,000-follower order runs over a couple of days. That pattern keeps your engagement ratio healthy and protects the reach you already earned. For creators in ${c} who rely on the algorithm to surface their content, that distinction is everything.`,
    `Pricing is transparent and flat per quantity. There are no subscriptions, no auto-renewals, no upsells in the checkout. You pay once for a package and we deliver it. Payment options cover bank transfer, card, Pix when available, and crypto (USDT, BTC). Receipts and invoices are emailed automatically and the full history stays inside your account so you can re-order with one click.`,
    `If you've never used a growth service before, the cheapest starter package is the safest way to test the waters. Pick a 100- or 250-follower bundle, watch how it lands, and only scale up once you're comfortable with what you see. The pages below let you pick from preset packages or use a slider to dial the exact quantity you want.`,
  ],
  bullets: () => [
    { title: "Real-looking profiles", body: "Followers with profile picture, bio and prior activity — not throwaway egg accounts." },
    { title: "Drip-feed pacing", body: "Deliveries are split over hours/days to mimic organic growth and avoid platform flags." },
    { title: "30-day refill", body: "If anyone unfollows within 30 days, we top your count back up automatically." },
    { title: "No password ever", body: "We only need your public @ handle. Never share your account password with any growth service." },
    { title: "Pay your way", body: "Card, bank transfer, Pix (where available) and crypto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "Is buying followers safe for my Instagram or TikTok account?", a: "Yes, when it's done at a sane pace. Viralefy distributes the order over hours or days so the platform sees a natural growth curve. We never request your password — only your public handle." },
    { q: "How long does delivery take?", a: "Small orders (up to 500) usually finish within 6 hours. Larger orders are split across 24–72 hours to keep the pace natural." },
    { q: "Can I lose the followers later?", a: "Drops are possible on every platform. That's why Viralefy includes a 30-day refill guarantee — we top your count back up at no cost." },
    { q: "Do you need my password?", a: "Never. We never ask for credentials. If anyone offering a growth service asks for your password, walk away." },
    { q: "What payment methods are supported?", a: "Card, bank transfer, local rails (Pix in Brazil), and crypto (USDT and BTC). Invoices are emailed automatically." },
  ],
};

// -------- seguidores (pt) --------
const COPY_SEGUIDORES_PT: LongCopy = {
  h1: (c) => `Comprar seguidores para Instagram e TikTok em ${c}`,
  metaTitle: (c) => `Comprar seguidores para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Compre seguidores reais para Instagram e TikTok em ${c}. Entrega rápida, garantia de reposição e suporte no seu idioma. Pague em real, USD, EUR ou cripto.`,
  paragraphs: (c) => [
    `Crescer do zero em ${c} é difícil. Os algoritmos do Instagram e do TikTok favorecem perfis que já parecem "vivos" — contas com base estável de seguidores, curtidas recorrentes e um mínimo de visualizações. Perfis novos caem num beco circular: ninguém te descobre porque você não tem tração, e você não ganha tração porque ninguém te descobre. Comprar um pacote inicial de seguidores é o caminho mais direto para sair desse ciclo e colocar seu conteúdo num pool de alcance maior.`,
    `A Viralefy entrega seguidores que ficam: perfis de alta qualidade, distribuídos em ritmo natural para que a plataforma nunca marque sua conta como compradora. Todo pacote vem com garantia de reposição — se alguém deixar de te seguir nos próximos 30 dias, repomos sem custo. Pedidos para ${c} começam em até 30 minutos depois da confirmação do pagamento e finalizam em 24 a 72 horas, dependendo do volume, sem precisar da sua senha. Pedimos só o seu @ público.`,
    `Diferente das lojas duvidosas que jogam milhares de bots de uma vez, a Viralefy trabalha em janelas de pacing que imitam o crescimento orgânico. Um pedido de 1.000 seguidores é dividido ao longo de algumas horas; um de 10.000 roda durante dois dias. Esse padrão mantém sua proporção de engajamento saudável e protege o alcance que você já conquistou. Para criadores em ${c} que dependem do algoritmo para distribuir o conteúdo, essa diferença é tudo.`,
    `O preço é direto e fixo por quantidade. Não tem assinatura, não tem renovação automática, não tem upsell escondido no checkout. Você paga uma vez pelo pacote, a gente entrega. As formas de pagamento cobrem boleto, cartão, Pix (no Brasil) e cripto (USDT, BTC). Os recibos chegam automáticos no e-mail e o histórico fica salvo na sua conta para você refazer o pedido com um clique.`,
    `Se você nunca usou um serviço de crescimento, o pacote mais barato é a melhor forma de testar a água. Pegue um starter de 100 ou 250 seguidores, observe o resultado, e só escale quando estiver confortável com o que vê. Logo abaixo você escolhe entre pacotes pré-definidos ou usa o slider para definir a quantidade exata que quer.`,
  ],
  bullets: () => [
    { title: "Perfis com cara de gente", body: "Seguidores com foto, bio e atividade prévia — nada de contas vazias." },
    { title: "Entrega gradual", body: "Distribuído em horas/dias para imitar crescimento orgânico e evitar bandeiras da plataforma." },
    { title: "Reposição por 30 dias", body: "Se alguém te deixar de seguir nos primeiros 30 dias, repomos automaticamente." },
    { title: "Nunca pedimos senha", body: "Só precisamos do seu @ público. Nenhum serviço sério pede a sua senha." },
    { title: "Pague como quiser", body: "Cartão, Pix, boleto e cripto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "É seguro comprar seguidores para o meu Instagram ou TikTok?", a: "Sim, quando feito em ritmo natural. A Viralefy distribui o pedido ao longo de horas ou dias para a plataforma ver uma curva orgânica. Nunca pedimos sua senha — só o seu @ público." },
    { q: "Quanto tempo leva a entrega?", a: "Pedidos pequenos (até 500) costumam terminar em até 6 horas. Pedidos maiores são divididos entre 24 e 72 horas para manter o ritmo natural." },
    { q: "Posso perder os seguidores depois?", a: "Quedas acontecem em qualquer plataforma. Por isso incluímos garantia de reposição por 30 dias — repomos sem custo." },
    { q: "Precisam da minha senha?", a: "Nunca. Não pedimos credencial nenhuma. Se alguém pedir, fuja correndo." },
    { q: "Quais pagamentos vocês aceitam?", a: "Cartão, Pix, boleto e cripto (USDT e BTC). O recibo chega automático no e-mail." },
  ],
};

// -------- seguidores (es) --------
const COPY_SEGUIDORES_ES: LongCopy = {
  h1: (c) => `Comprar seguidores para Instagram y TikTok en ${c}`,
  metaTitle: (c) => `Comprar seguidores para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Compra seguidores reales para Instagram y TikTok en ${c}. Entrega rápida, garantía de reposición y soporte en tu idioma. Paga en USD, EUR o cripto.`,
  paragraphs: (c) => [
    `Crecer desde cero en ${c} es duro. Los algoritmos de Instagram y TikTok favorecen a las cuentas que ya parecen "vivas" — perfiles con una base estable de seguidores, likes recurrentes y un mínimo de visualizaciones. Los perfiles nuevos caen en un círculo vicioso: nadie te descubre porque no tienes tracción y no tienes tracción porque nadie te descubre. Comprar un paquete inicial de seguidores es la forma más directa de romper ese círculo y meter tu contenido en una piscina de alcance mayor.`,
    `Viralefy entrega seguidores que se quedan: perfiles de alta calidad distribuidos a un ritmo natural para que la plataforma nunca marque tu cuenta como compradora. Cada paquete viene con garantía de reposición — si alguien deja de seguirte dentro de 30 días, reponemos sin coste. Los pedidos para ${c} arrancan en menos de 30 minutos tras la confirmación del pago y terminan en 24 a 72 horas según el volumen, sin necesidad de compartir tu contraseña. Solo necesitamos tu @ público.`,
    `A diferencia de las tiendas dudosas que lanzan miles de bots de golpe, Viralefy trabaja en ventanas de pacing que imitan el crecimiento orgánico. Un pedido de 1.000 seguidores se reparte en varias horas; uno de 10.000 corre durante un par de días. Ese patrón mantiene tu ratio de engagement sano y protege el alcance que ya tienes. Para creadores en ${c} que dependen del algoritmo para difundir su contenido, esa diferencia lo es todo.`,
    `El precio es transparente y plano por cantidad. Sin suscripciones, sin renovaciones automáticas, sin upsells escondidos en el checkout. Pagas una vez por el paquete y lo entregamos. Las formas de pago cubren tarjeta, transferencia, y cripto (USDT, BTC). Los recibos llegan automáticos al correo y el historial queda guardado en tu cuenta para que repitas el pedido con un clic.`,
    `Si nunca usaste un servicio de crecimiento, el paquete más barato es la mejor forma de probar. Empieza con 100 o 250 seguidores, mira cómo cae, y solo escala cuando te sientas cómodo con lo que ves. Más abajo eliges entre paquetes preestablecidos o usas el deslizador para definir la cantidad exacta.`,
  ],
  bullets: () => [
    { title: "Perfiles con cara de personas", body: "Seguidores con foto, bio y actividad previa — nada de cuentas vacías." },
    { title: "Entrega gradual", body: "Distribuido en horas/días para imitar el crecimiento orgánico." },
    { title: "Reposición de 30 días", body: "Si alguien te deja de seguir en los primeros 30 días, reponemos automáticamente." },
    { title: "Nunca pedimos contraseña", body: "Solo necesitamos tu @ público." },
    { title: "Paga como quieras", body: "Tarjeta, transferencia y cripto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "¿Es seguro comprar seguidores para mi Instagram o TikTok?", a: "Sí, si se hace a ritmo natural. Viralefy distribuye el pedido a lo largo de horas o días para que la plataforma vea una curva orgánica. Nunca pedimos tu contraseña." },
    { q: "¿Cuánto tarda la entrega?", a: "Pedidos pequeños (hasta 500) terminan en menos de 6 horas. Pedidos grandes se reparten en 24–72 horas." },
    { q: "¿Puedo perder los seguidores después?", a: "Las bajas son posibles. Por eso incluimos garantía de reposición de 30 días — reponemos sin coste." },
    { q: "¿Necesitan mi contraseña?", a: "Nunca. No pedimos credenciales. Si alguien te las pide, sospechá." },
    { q: "¿Qué pagos aceptan?", a: "Tarjeta, transferencia y cripto (USDT y BTC)." },
  ],
};

// -------- engajamento --------
const COPY_ENG_EN: LongCopy = {
  h1: (c) => `Buy likes & engagement for Instagram and TikTok in ${c}`,
  metaTitle: (c) => `Buy Instagram & TikTok likes in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Boost any post with real-looking likes and engagement in ${c}. Delivery starts in 30 minutes, no password required.`,
  paragraphs: (c) => [
    `Likes are the first social proof a viewer sees. A post with 12 likes reads "amateur"; the same post with 1,200 reads "must be worth a look". The algorithm uses early engagement as one of the strongest ranking signals — a post that gets a strong like-to-impression ratio in the first hour gets pushed harder. That's the window where buying likes pays for itself in ${c}: you raise the floor of the early curve and let the algorithm do the rest.`,
    `Viralefy delivers likes from accounts that have profile pictures, posts and real-looking activity — not the throwaway profiles that platforms scrub during the next sweep. Every like is paced naturally over the first hour so the rise looks organic. If you pair it with a follower package the lift compounds: more followers means a wider impression pool, more likes means a higher CTR on those impressions, and the post climbs faster.`,
    `Engagement packs cover the whole spectrum from a starter 1,000-like boost up to full-stack campaigns with thousands of likes and saved comments per post. Pricing is flat per package — no per-post penalties, no minimum monthly volume. You buy a package, point it at a public URL, and we deliver. If a like drops in the first 30 days we top it back up. Posts in ${c} get priority routing to followers in the right time zone so the early curve falls during peak hours.`,
    `Engagement campaigns work for product launches, reel pushes, contest posts, and "first post of a new account" scenarios where landing well matters more than anything. They don't replace good content — but they do amplify it. A weak post with 10,000 likes is still a weak post; a strong post with 10,000 likes is a viral candidate. Pick the strongest content you have and back it with engagement, not the other way around.`,
    `Below you can pick from preset like packages or use the slider to set the exact volume you want. All deliveries are anonymous and never visible to your audience.`,
  ],
  bullets: () => [
    { title: "First-hour lift", body: "Likes land in the early curve where the algorithm weighs them most." },
    { title: "Real-looking profiles", body: "Active accounts with bio and posts — not the obvious throwaways." },
    { title: "Anonymous", body: "Deliveries are not visible to your audience or to platform automated checks." },
    { title: "30-day refill", body: "Any drop within 30 days is topped back up at no cost." },
    { title: "Compatible with followers", body: "Stack with a follower package for a compounded lift on the same post." },
  ],
  faq: () => [
    { q: "Will the platform detect bought likes?", a: "Likes are paced over the first hour to mimic organic growth. The accounts have profile pictures and activity, not empty-egg patterns." },
    { q: "Do you need the post URL?", a: "Yes — paste the public post or reel URL during checkout. Private posts cannot be reached." },
    { q: "Can I split a package across multiple posts?", a: "Each package targets one post. Run several orders to cover multiple posts." },
    { q: "How fast does delivery start?", a: "Most orders start within 30 minutes of payment confirmation." },
  ],
};

const COPY_ENG_PT: LongCopy = {
  h1: (c) => `Comprar curtidas e engajamento em ${c}`,
  metaTitle: (c) => `Comprar curtidas para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsione qualquer post com curtidas e engajamento reais em ${c}. Início em 30 minutos, sem senha.`,
  paragraphs: (c) => [
    `Curtida é a primeira prova social que o usuário vê. Um post com 12 curtidas lê "amador"; o mesmo post com 1.200 lê "deve valer a pena olhar". O algoritmo usa o engajamento inicial como um dos sinais mais fortes de ranqueamento — um post com uma razão curtida/impressão alta na primeira hora ganha empurrão. Essa é a janela em que comprar curtidas em ${c} se paga: você levanta o piso da curva inicial e deixa o algoritmo fazer o resto.`,
    `A Viralefy entrega curtidas vindas de contas com foto, posts e atividade real — não os perfis descartáveis que as plataformas limpam na próxima varredura. Cada curtida é distribuída de forma natural ao longo da primeira hora para a subida parecer orgânica. Combinado com um pacote de seguidores o efeito compõe: mais seguidores = pool de impressões maior, mais curtidas = CTR maior sobre essas impressões, e o post sobe mais rápido.`,
    `Os pacotes de engajamento cobrem todo o espectro, do starter de 1.000 curtidas até campanhas full-stack com milhares de curtidas e comentários por post. Preço fixo por pacote — sem penalidade por post, sem volume mínimo mensal. Você compra um pacote, aponta para uma URL pública, e a gente entrega. Se uma curtida cair nos primeiros 30 dias, repomos. Posts em ${c} têm prioridade de roteamento para perfis no fuso certo, fazendo a curva inicial cair no horário de pico.`,
    `Campanhas de engajamento funcionam para lançamento de produto, push de reels, post de sorteio, e cenários "primeiro post da conta nova" em que cair bem é tudo. Não substituem conteúdo bom — mas amplificam. Um post fraco com 10.000 curtidas continua sendo fraco; um post forte com 10.000 curtidas é candidato a viralizar. Coloque seu melhor conteúdo embaixo da campanha, não o pior.`,
    `Abaixo dá pra escolher entre pacotes pré-definidos ou usar o slider para definir o volume exato. Toda entrega é anônima e invisível pra sua audiência.`,
  ],
  bullets: () => [
    { title: "Empurrão na primeira hora", body: "As curtidas caem na curva inicial onde o algoritmo dá mais peso." },
    { title: "Perfis com cara de gente", body: "Contas ativas com bio e posts — nada de descartáveis óbvios." },
    { title: "Anônimo", body: "A entrega não é visível para a sua audiência nem para checagens automáticas." },
    { title: "Reposição por 30 dias", body: "Qualquer queda nos primeiros 30 dias é reposta sem custo." },
    { title: "Combina com seguidores", body: "Empilhe com pacote de seguidores para empurrar o mesmo post duas vezes." },
  ],
  faq: () => [
    { q: "A plataforma vai detectar?", a: "As curtidas caem ao longo da primeira hora para imitar orgânico. As contas têm foto e atividade, não são perfis vazios." },
    { q: "Vocês precisam da URL do post?", a: "Sim — cole a URL pública do post ou reel no checkout. Posts privados não são alcançáveis." },
    { q: "Posso dividir o pacote em vários posts?", a: "Cada pacote mira um post. Faça vários pedidos pra cobrir vários posts." },
    { q: "Em quanto tempo começa?", a: "A maioria dos pedidos começa em até 30 minutos após confirmar o pagamento." },
  ],
};

const COPY_ENG_ES: LongCopy = {
  h1: (c) => `Comprar likes e interacciones para Instagram y TikTok en ${c}`,
  metaTitle: (c) => `Comprar likes para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsa cualquier publicación con likes reales en ${c}. Comienzo en 30 minutos, sin contraseña.`,
  paragraphs: (c) => [
    `Los likes son la primera prueba social. Un post con 12 likes parece amateur; el mismo post con 1.200 parece "vale la pena verlo". El algoritmo usa el engagement inicial como una de las señales más fuertes — un post con buena ratio like/impresión en la primera hora se empuja más. Esa es la ventana en que comprar likes en ${c} se paga: levantas el piso de la curva inicial y dejas que el algoritmo haga el resto.`,
    `Viralefy entrega likes desde cuentas con foto, posts y actividad real — no los perfiles desechables que las plataformas limpian en la siguiente barrida. Cada like se distribuye de forma natural a lo largo de la primera hora para que la subida parezca orgánica. Combinado con un paquete de seguidores el efecto se compone.`,
    `Los paquetes cubren todo el espectro, desde un starter de 1.000 likes hasta campañas full-stack con miles de likes y comentarios por post. Precio fijo por paquete — sin penalización por post, sin volumen mínimo. Pagas, apuntas a una URL pública, entregamos. Si un like cae en los primeros 30 días, lo reponemos.`,
    `Las campañas de engagement funcionan para lanzamientos de producto, push de reels, sorteos y "primer post de cuenta nueva" donde aterrizar bien lo es todo. No reemplazan al buen contenido — lo amplifican. Pon tu mejor contenido detrás de la campaña.`,
    `Abajo eliges entre paquetes preestablecidos o usas el deslizador para fijar el volumen exacto. Cada entrega es anónima e invisible para tu audiencia.`,
  ],
  bullets: () => [
    { title: "Empuje en la primera hora", body: "Los likes caen en la curva inicial donde el algoritmo pesa más." },
    { title: "Perfiles reales", body: "Cuentas activas con bio y posts." },
    { title: "Anónimo", body: "La entrega no es visible para tu audiencia." },
    { title: "Reposición de 30 días", body: "Cualquier baja dentro de 30 días se repone gratis." },
    { title: "Combina con seguidores", body: "Apila con un paquete de seguidores para empujar el mismo post dos veces." },
  ],
  faq: () => [
    { q: "¿La plataforma detecta likes comprados?", a: "Los likes caen a lo largo de la primera hora para imitar lo orgánico. Las cuentas tienen foto y actividad." },
    { q: "¿Necesitan la URL del post?", a: "Sí — pega la URL pública del post o reel en el checkout." },
    { q: "¿Puedo repartir el paquete entre varios posts?", a: "Cada paquete apunta a un post. Haz varios pedidos para cubrir varios posts." },
    { q: "¿Cuánto tarda en empezar?", a: "La mayoría arranca en menos de 30 minutos." },
  ],
};

// -------- visualizações --------
const COPY_VIEWS_EN: LongCopy = {
  h1: (c) => `Buy Reels, TikTok and Story views in ${c}`,
  metaTitle: (c) => `Buy Instagram & TikTok views in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Boost any video with real-looking views in ${c}. Reels, TikTok and Stories. Delivery starts in 30 minutes.`,
  paragraphs: (c) => [
    `View count is the headline metric for any short-form video. A reel sitting at 320 views looks dead; the same reel at 32,000 looks like it's catching fire. Viewers in ${c} use that number as a heuristic to decide whether to watch — and the algorithm uses it as a ranking signal to decide whether to push the video further. Buying views is the cheapest way to raise that baseline.`,
    `Viralefy delivers views that count for the algorithm: full-watch impressions from accounts that have real activity, paced so the rise mirrors organic discovery. Stories views are non-public to your followers; Reels views are public and add directly to the count displayed on your profile. Both work the same way for the algorithm.`,
    `View packs scale from 10k all the way up to 1M+ per video. Pricing is per package and lower than a TikTok or Instagram ad campaign with the same impression count — and the views you get from a paid ad disappear from the public view counter the moment the campaign ends. View campaigns from Viralefy stick.`,
    `For creators in ${c} who post several videos a week, running a small view boost on each new upload is a low-friction way to feed the algorithm the early signal it needs. The 30-day refill applies here too — if views drop they're replaced.`,
    `Pick a preset below or define the exact view count you want with the slider.`,
  ],
  bullets: () => [
    { title: "Counted by the algorithm", body: "Full-watch impressions, not 1-second skips." },
    { title: "Reels & Stories", body: "Works for any short-form format." },
    { title: "Stays on the counter", body: "Unlike paid ads, the count doesn't disappear when the campaign ends." },
    { title: "30-day refill", body: "Any drop within 30 days is replenished." },
    { title: "Per-video pricing", body: "Flat price per package. No subscription." },
  ],
  faq: () => [
    { q: "Do bought views count for monetization?", a: "Views from Viralefy add to your public counter but do not directly contribute to monetization criteria like Reels Bonus eligibility — the platform measures those separately." },
    { q: "How long do views take to arrive?", a: "Small orders (up to 10k) finish in 1–3 hours. Large orders are spread across 24h to keep the curve natural." },
    { q: "Can I buy views for a Story?", a: "Yes — Story views are supported, but only while the Story is live (24h window)." },
    { q: "Will my video reach a wider audience as a result?", a: "Views raise the ranking signal in the algorithm. Whether the video then reaches further depends on watch-time and like ratio." },
  ],
};

const COPY_VIEWS_PT: LongCopy = {
  h1: (c) => `Comprar visualizações de Reels, TikTok e Stories em ${c}`,
  metaTitle: (c) => `Comprar visualizações para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsione qualquer vídeo com visualizações reais em ${c}. Reels, TikTok e Stories. Início em 30 minutos.`,
  paragraphs: (c) => [
    `Visualização é a métrica de manchete de qualquer vídeo curto. Um reel parado em 320 views parece morto; o mesmo reel em 32.000 parece estar pegando fogo. Os espectadores em ${c} usam esse número como heurística pra decidir se assistem — e o algoritmo usa como sinal de ranqueamento pra decidir se empurra o vídeo mais longe. Comprar views é a forma mais barata de subir essa linha de base.`,
    `A Viralefy entrega views que contam para o algoritmo: impressões de assistência completa, vindas de contas com atividade real, distribuídas para a curva imitar descoberta orgânica. Views de Story não aparecem para sua audiência; views de Reels aparecem no contador público. Os dois funcionam igual para o algoritmo.`,
    `Os pacotes vão de 10 mil até 1 milhão+ por vídeo. O preço por pacote é mais baixo que uma campanha de ads no TikTok ou Instagram com o mesmo número de impressões — e as views vindas de anúncio somem do contador público quando a campanha acaba. As views da Viralefy ficam.`,
    `Pra criadores em ${c} que postam vários vídeos por semana, rodar um pequeno boost de views em cada upload novo é uma forma de baixo atrito de alimentar o algoritmo com o sinal inicial que ele precisa. A reposição de 30 dias vale aqui também.`,
    `Escolhe um pacote pronto abaixo ou define a quantidade exata com o slider.`,
  ],
  bullets: () => [
    { title: "Contam pro algoritmo", body: "Impressões de assistência completa, não pulos de 1 segundo." },
    { title: "Reels e Stories", body: "Funciona pra qualquer formato curto." },
    { title: "Ficam no contador", body: "Diferente de ads, a contagem não some quando acaba." },
    { title: "Reposição por 30 dias", body: "Quedas em 30 dias são repostas." },
    { title: "Preço por vídeo", body: "Pacote fixo. Sem assinatura." },
  ],
  faq: () => [
    { q: "Views compradas contam pra monetização?", a: "Somam no contador público mas não contam diretamente pros critérios de monetização como Reels Bonus — a plataforma mede isso à parte." },
    { q: "Quanto demora a entrega?", a: "Pedidos pequenos (até 10k) terminam em 1–3 horas. Pedidos grandes correm em 24h." },
    { q: "Posso comprar views pra Story?", a: "Sim — Stories são suportados, mas só enquanto o Story está no ar (janela de 24h)." },
    { q: "Meu vídeo vai alcançar mais gente?", a: "As views sobem o sinal no algoritmo. Se o vídeo vai mais longe depois disso depende do tempo de visualização e da razão de curtidas." },
  ],
};

const COPY_VIEWS_ES: LongCopy = {
  h1: (c) => `Comprar visualizaciones de Reels, TikTok y Stories en ${c}`,
  metaTitle: (c) => `Comprar visualizaciones para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsa cualquier vídeo con visualizaciones reales en ${c}. Reels, TikTok y Stories. Inicio en 30 minutos.`,
  paragraphs: (c) => [
    `La cantidad de vistas es la métrica titular de cualquier vídeo corto. Un reel con 320 vistas parece muerto; el mismo reel con 32.000 parece estar despegando. Los espectadores en ${c} usan ese número como heurística para decidir si miran — y el algoritmo lo usa como señal de ranking para decidir si empuja el vídeo más lejos.`,
    `Viralefy entrega vistas que cuentan para el algoritmo: impresiones de visualización completa desde cuentas con actividad real, distribuidas para que la curva parezca orgánica. Las vistas de Stories no son públicas para tu audiencia; las vistas de Reels son públicas y se suman al contador del perfil.`,
    `Los paquetes van desde 10k hasta 1M+ por vídeo. El precio por paquete es menor que una campaña de ads con el mismo número de impresiones — y las vistas de ads desaparecen cuando termina la campaña. Las de Viralefy se quedan.`,
    `Para creadores en ${c} que postean varios vídeos por semana, correr un pequeño boost de vistas en cada upload nuevo es una forma de baja fricción de alimentar al algoritmo. La reposición de 30 días aplica aquí también.`,
    `Elige un paquete preestablecido abajo o define la cantidad exacta con el deslizador.`,
  ],
  bullets: () => [
    { title: "Cuentan para el algoritmo", body: "Impresiones de visualización completa." },
    { title: "Reels y Stories", body: "Funciona para todo formato corto." },
    { title: "Quedan en el contador", body: "A diferencia de ads, el conteo no se borra." },
    { title: "Reposición de 30 días", body: "Las bajas se reponen." },
    { title: "Precio por vídeo", body: "Paquete fijo. Sin suscripción." },
  ],
  faq: () => [
    { q: "¿Las vistas compradas cuentan para monetización?", a: "Suman al contador público pero no cuentan directamente para criterios de monetización como Reels Bonus." },
    { q: "¿Cuánto tarda la entrega?", a: "Pedidos pequeños (hasta 10k) terminan en 1–3 horas. Grandes en 24h." },
    { q: "¿Vistas para Story?", a: "Sí, pero solo mientras la Story esté activa (24h)." },
    { q: "¿Mi vídeo llegará más lejos?", a: "Las vistas suben la señal del algoritmo. El alcance posterior depende del watch-time y la ratio de likes." },
  ],
};

// -------- serviços premium --------
const COPY_SERV_EN: LongCopy = {
  h1: (c) => `Premium growth services for Instagram & TikTok in ${c}`,
  metaTitle: (c) => `Premium social media management in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Hands-on growth, content strategy and account management for serious creators in ${c}.`,
  paragraphs: (c) => [
    `Premium services are for creators in ${c} who want more than a one-shot follower boost — for accounts that are building a brand and need a continuous strategy. Each retainer covers content planning, performance reviews, hashtag research, posting cadence, and monthly engagement budgets baked in.`,
    `The team works one-on-one with each retained account. We start with an audit of the current numbers (reach, engagement rate, follower demographics, posting cadence), set a 90-day target, and design the content calendar to hit it. Where it makes sense we layer in Viralefy follower and engagement packs to accelerate the curve.`,
    `Pricing is monthly — no long-term lock-in. Cancel anytime with one click from your account. Reports land on the first of every month with the actual numbers, what worked, what didn't, and the plan for the next 30 days.`,
    `If you're considering a premium retainer for a serious project in ${c}, message support before checkout — we'll run a short discovery call to make sure we're the right fit before either side spends a cent.`,
    `For everything else, the self-serve follower, like and view packs already cover the most common needs.`,
  ],
  bullets: () => [
    { title: "Monthly strategy", body: "Content calendar, posting cadence, hashtag research." },
    { title: "Monthly reports", body: "Numbers, what worked, what didn't, plan for next 30 days." },
    { title: "Engagement budget", body: "Follower and engagement packs baked in." },
    { title: "Cancel anytime", body: "No long-term lock-in." },
    { title: "Real account manager", body: "One human owns your account, in your language." },
  ],
  faq: () => [
    { q: "Is this for personal or business accounts?", a: "Both. We work with creators, brands and small businesses." },
    { q: "What's the commitment?", a: "Monthly. Cancel any time." },
    { q: "Do I need to give up account access?", a: "No. We coordinate posting with you. We never log into your account." },
    { q: "How do I start?", a: "Message support before checkout — we run a short discovery call first." },
  ],
};

const COPY_SERV_PT: LongCopy = {
  h1: (c) => `Serviços premium de crescimento em ${c}`,
  metaTitle: (c) => `Gestão premium para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Gestão hands-on, estratégia de conteúdo e crescimento para criadores sérios em ${c}.`,
  paragraphs: (c) => [
    `Serviços premium são pra criadores em ${c} que querem mais que um boost pontual — pra contas que estão construindo uma marca e precisam de estratégia contínua. Cada retainer cobre planejamento de conteúdo, revisões de performance, pesquisa de hashtag, cadência de postagem, e orçamento de engajamento embutido.`,
    `O time trabalha 1-a-1 com cada conta retida. Começamos com auditoria dos números atuais (alcance, taxa de engajamento, demografia, cadência), definimos meta de 90 dias, e desenhamos o calendário pra bater. Onde faz sentido, encaixamos pacotes de seguidores e engajamento da própria Viralefy pra acelerar.`,
    `Cobrança mensal — sem lock-in. Cancela a qualquer momento com um clique pela conta. Relatório cai no primeiro dia de cada mês com os números reais, o que funcionou, o que não, e o plano dos próximos 30 dias.`,
    `Se você tá pensando num retainer premium pra um projeto sério em ${c}, manda mensagem pro suporte antes do checkout — fazemos uma call curta de descoberta pra garantir o encaixe antes de qualquer lado gastar um centavo.`,
    `Pra tudo o mais, os pacotes self-serve de seguidores, curtidas e views já cobrem as necessidades mais comuns.`,
  ],
  bullets: () => [
    { title: "Estratégia mensal", body: "Calendário de conteúdo, cadência, pesquisa de hashtag." },
    { title: "Relatório mensal", body: "Os números reais, plano dos próximos 30 dias." },
    { title: "Orçamento de engajamento", body: "Pacotes de seguidores e engajamento embutidos." },
    { title: "Cancele quando quiser", body: "Sem lock-in." },
    { title: "Gerente humano", body: "Uma pessoa cuida da sua conta, no seu idioma." },
  ],
  faq: () => [
    { q: "Pra conta pessoal ou empresa?", a: "Os dois. A gente atende criador, marca e pequena empresa." },
    { q: "Qual o compromisso?", a: "Mensal. Cancela quando quiser." },
    { q: "Preciso entregar a senha?", a: "Não. A gente coordena postagem com você. Nunca logamos na conta." },
    { q: "Como começo?", a: "Fala com o suporte antes do checkout — fazemos uma call curta primeiro." },
  ],
};

const COPY_SERV_ES: LongCopy = {
  h1: (c) => `Servicios premium de crecimiento en ${c}`,
  metaTitle: (c) => `Gestión premium para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Gestión hands-on, estrategia de contenido y crecimiento para creadores serios en ${c}.`,
  paragraphs: (c) => [
    `Los servicios premium son para creadores en ${c} que quieren más que un impulso puntual — para cuentas que están construyendo una marca y necesitan estrategia continua.`,
    `El equipo trabaja uno-a-uno con cada cuenta. Empezamos con auditoría de los números actuales, definimos una meta de 90 días y diseñamos el calendario de contenido.`,
    `Cobro mensual sin lock-in. Cancela en cualquier momento. Informe el primer día de cada mes.`,
    `Si estás considerando un retainer premium, manda mensaje al soporte antes del checkout para una llamada de descubrimiento.`,
    `Para todo lo demás, los paquetes self-serve cubren las necesidades comunes.`,
  ],
  bullets: () => [
    { title: "Estrategia mensual", body: "Calendario, cadencia, hashtags." },
    { title: "Informe mensual", body: "Los números, plan próximos 30 días." },
    { title: "Presupuesto incluido", body: "Paquetes embebidos." },
    { title: "Cancela cuando quieras", body: "Sin lock-in." },
    { title: "Gerente humano", body: "Una persona, en tu idioma." },
  ],
  faq: () => [
    { q: "¿Personal o empresa?", a: "Ambos." },
    { q: "¿Compromiso?", a: "Mensual." },
    { q: "¿Necesitan mi contraseña?", a: "No." },
    { q: "¿Cómo empiezo?", a: "Mensaje al soporte primero." },
  ],
};

// Tabela final — categoria × idioma → cópia. Fallback: en.
export const COPY: Record<CategoryCode, Partial<Record<LangCode, LongCopy>>> = {
  seguidores: { en: COPY_SEGUIDORES_EN, pt: COPY_SEGUIDORES_PT, es: COPY_SEGUIDORES_ES, es_AR: COPY_SEGUIDORES_ES },
  engajamento: { en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES },
  visualizacoes: { en: COPY_VIEWS_EN, pt: COPY_VIEWS_PT, es: COPY_VIEWS_ES, es_AR: COPY_VIEWS_ES },
  servicos: { en: COPY_SERV_EN, pt: COPY_SERV_PT, es: COPY_SERV_ES, es_AR: COPY_SERV_ES },
};

export function copyFor(category: CategoryCode, lang: LangCode): LongCopy {
  return COPY[category][lang] ?? COPY[category].en ?? COPY_SEGUIDORES_EN;
}
