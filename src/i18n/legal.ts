// Documentos legais (privacidade, termos, cookies, reembolso, sobre, contato).
// PT e EN escritos em prosa real; outros idiomas caem no EN como fallback
// indexável (idêntica a "international English version" — Google aceita).
// Atualize aqui quando precisar versionar — `updatedAt` move pra cima.

import type { LangCode } from "./languages";

export type LegalSlug = "privacy" | "terms" | "cookies" | "refund" | "about" | "contact";

export const LEGAL_SLUGS: LegalSlug[] = ["privacy", "terms", "cookies", "refund", "about", "contact"];

export type LegalDoc = {
  title: string;
  updatedAt: string;     // ISO date
  body: string;          // markdown-lite renderizado como sequência de blocos
};

// O `body` aceita markdown bem simples — ## para headings e parágrafos por linha.
// Renderizado por `renderLegal()` em `lib/legal-render.ts`.

const EN: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Privacy Policy",
    updatedAt: "2026-05-30",
    body: `## Who we are
Viralefy is operated by the team that runs viralefy.com. We provide social media growth services for Instagram and TikTok.

## What we collect
We collect the data you give us at checkout (name, email, the public @ handle of your target account, the public URL of any post you order against) and the data we need to process payments (currency, payment method, gateway transaction reference). We never ask for and never store your account password.

## How we use it
The personal data is used to (a) deliver the service you bought, (b) issue invoices and receipts, (c) answer support tickets, and (d) send transactional emails (order confirmation, refund notice). We do not sell or share your data with third parties for marketing.

## Sub-processors
We use: a payment processor (Woovi for BRL, Heleket for crypto), a transactional email provider (Resend), a hosting provider (Hetzner) and a CDN (Cloudflare). Each sub-processor processes data strictly for the technical purpose listed.

## Your rights
You can request export or deletion of your data at any time by writing to support. Deletion is honored within 30 days. Some records (invoices) must be retained for legal accounting periods.

## Security
All traffic is encrypted in transit (TLS). Passwords (for the Viralefy account, not for your Instagram/TikTok) are hashed with bcrypt. Payment data is processed by the gateway and never touches our servers.

## Cookies
See the Cookie Policy. We use a minimal session cookie and no third-party marketing cookies on the main site.

## Contact
Write to support via the in-account ticket system, or to the email listed in the footer.`,
  },
  terms: {
    title: "Terms of Service",
    updatedAt: "2026-05-30",
    body: `## Agreement
By buying a service from Viralefy you agree to these terms. If you don't agree, don't buy.

## Service description
Viralefy delivers followers, likes, views and related engagement to publicly visible Instagram and TikTok accounts and posts. We do not access your account; we never request your password. Delivery times are estimates, not guarantees.

## Eligibility
You must be 18 or older. The account or post you order against must be public at the time of delivery and must comply with the rules of the underlying platform (Instagram, TikTok). We reserve the right to refuse or cancel an order targeting content that violates platform rules or applicable law.

## Refunds and refills
A 30-day refill guarantee covers follower and engagement packages. Refund policy is described separately under "Refund Policy".

## Payment
Prices are shown including any applicable taxes for the displayed currency. Payment is captured at checkout. Crypto payments are final once confirmed on-chain.

## No platform affiliation
Viralefy is not affiliated with Instagram, TikTok or Meta Platforms. We are an independent third-party service.

## Limitation of liability
Viralefy is not liable for actions taken by the underlying platforms against your account. Use of the service is at your own risk.

## Changes
We may update these terms. The "updated at" date at the top will move. Continued use after a change counts as acceptance.

## Governing law
These terms are governed by the law of the place where Viralefy is registered. Disputes go to the competent court there.`,
  },
  cookies: {
    title: "Cookie Policy",
    updatedAt: "2026-05-30",
    body: `## What we use
Viralefy uses one essential cookie to keep you signed in (\`viralefy_token\`) and one preference cookie for currency selection. No third-party advertising or tracking cookies are set on the main site.

## Why
The token cookie is required to keep your session active across pages. The currency cookie remembers your last currency choice so you don't have to re-pick it on every visit.

## Lifetime
The session cookie lasts 30 days. The currency cookie lasts 1 year. Both can be cleared from your browser settings at any time.

## Third parties
The payment gateways (Woovi, Heleket) may set their own cookies on their own pages when you complete a payment. Those are governed by the gateway's privacy policy, not ours.

## Consent
The cookies we use are strictly functional and exempt from the EU/UK consent banner requirement. We do not run a banner for that reason.`,
  },
  refund: {
    title: "Refund Policy",
    updatedAt: "2026-05-30",
    body: `## Refill first
Most issues are not a quality issue but a follower-drop or pacing question. Both are covered by our 30-day refill — no refund needed, we just top your numbers back up.

## When a refund applies
- The service could not be delivered (the target account or post was private, deleted or blocked at our end).
- The order was duplicated by accident and we charged twice for the same package.
- An obvious billing mistake (wrong amount).

## When a refund does not apply
- You changed your mind after delivery completed.
- The platform took action against the target account for a separate reason.
- A drop within 30 days that we already offered to refill.

## How to request
Open a support ticket from inside your account or write to the email in the footer with the order ID. We respond within 48 hours. Approved refunds land back on the original payment method within 5 business days for card and bank, or by separate crypto transaction for crypto.`,
  },
  about: {
    title: "About Viralefy",
    updatedAt: "2026-05-30",
    body: `## What we do
Viralefy helps creators, brands and small businesses break out of the cold-start problem on Instagram and TikTok. We sell follower, engagement and view packages, with a focus on quality, pacing and honest pricing.

## Who we serve
We ship to 60+ countries across the Americas and Europe (SEPA). Every market has its own page in the local language and currency.

## Our promise
- No password required, ever.
- No bots that disappear next week.
- 30-day refill guarantee.
- Real humans on support.

## Contact
The in-account ticket system is the fastest path. Email is in the footer.`,
  },
  contact: {
    title: "Contact support",
    updatedAt: "2026-05-30",
    body: `## Fastest path
The in-account ticket system. Sign in, open a ticket — we answer in your language within 24 business hours.

## Email
support@viralefy.com — slower than the ticket system because we triage tickets first.

## What to include
- The order ID (visible in your account).
- A short description of what happened.
- Screenshots if it's a delivery issue.

## What we don't do
We don't ask for passwords. We don't run a phone line. We don't issue refunds outside the refund policy.`,
  },
};

const PT: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Política de Privacidade",
    updatedAt: "2026-05-30",
    body: `## Quem somos
A Viralefy é operada pela equipe responsável pelo viralefy.com. Prestamos serviços de crescimento em redes sociais para Instagram e TikTok.

## O que coletamos
Coletamos os dados que você nos fornece no checkout (nome, e-mail, o @ público da conta-alvo, a URL pública de qualquer publicação contratada) e os dados necessários para processar pagamentos (moeda, método de pagamento, referência de transação no gateway). Nunca pedimos nem armazenamos a senha da sua conta.

## Como usamos
Os dados pessoais são usados para (a) entregar o serviço comprado, (b) emitir faturas e recibos, (c) responder tickets de suporte e (d) enviar e-mails transacionais (confirmação de pedido, aviso de reembolso). Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.

## Subprocessadores
Usamos: processador de pagamento (Woovi para BRL, Heleket para cripto), provedor de e-mail transacional (Resend), provedor de hospedagem (Hetzner) e CDN (Cloudflare). Cada subprocessador trata dados estritamente para a finalidade técnica descrita.

## Seus direitos
Você pode pedir exportação ou exclusão dos seus dados a qualquer momento via suporte. Exclusões são honradas em até 30 dias. Alguns registros (faturas) precisam ser mantidos por períodos legais de escrituração.

## Segurança
Todo tráfego é criptografado em trânsito (TLS). As senhas (da conta Viralefy, não do Instagram/TikTok) são hasheadas com bcrypt. Dados de pagamento são processados pelo gateway e não tocam nossos servidores.

## Cookies
Veja a Política de Cookies. Usamos um cookie de sessão mínimo e nenhum cookie de marketing de terceiros no site principal.

## Contato
Escreva ao suporte pelo sistema de tickets da conta ou no e-mail listado no rodapé.`,
  },
  terms: {
    title: "Termos de Serviço",
    updatedAt: "2026-05-30",
    body: `## Aceitação
Ao comprar um serviço na Viralefy você concorda com estes termos. Se não concorda, não compre.

## Descrição do serviço
A Viralefy entrega seguidores, curtidas, visualizações e engajamento relacionado a contas e publicações públicas do Instagram e TikTok. Não acessamos sua conta; nunca pedimos sua senha. Os prazos de entrega são estimativas, não garantias.

## Elegibilidade
Você precisa ter 18 anos ou mais. A conta ou publicação alvo precisa estar pública no momento da entrega e estar em conformidade com as regras da plataforma (Instagram, TikTok). Reservamos o direito de recusar ou cancelar pedidos que mirem conteúdo que viole regras da plataforma ou da legislação aplicável.

## Reembolsos e reposição
A garantia de reposição de 30 dias cobre pacotes de seguidores e engajamento. A política de reembolso está descrita em documento separado ("Política de Reembolso").

## Pagamento
Os preços são exibidos já incluindo eventuais tributos para a moeda exibida. O pagamento é capturado no checkout. Pagamentos em cripto são finais quando confirmados na rede.

## Sem afiliação com plataformas
A Viralefy não é afiliada ao Instagram, TikTok ou Meta Platforms. Somos um serviço independente de terceiros.

## Limitação de responsabilidade
A Viralefy não se responsabiliza por ações tomadas pelas plataformas subjacentes contra sua conta. O uso do serviço é por sua conta e risco.

## Alterações
Podemos atualizar estes termos. A data "atualizado em" no topo será movida. O uso continuado após a alteração conta como aceitação.

## Lei aplicável
Estes termos são regidos pela lei do local de registro da Viralefy. Disputas seguem para o foro competente local.`,
  },
  cookies: {
    title: "Política de Cookies",
    updatedAt: "2026-05-30",
    body: `## O que usamos
A Viralefy usa um cookie essencial para manter sua sessão (\`viralefy_token\`) e um cookie de preferência para a moeda escolhida. Não definimos cookies de publicidade ou rastreamento de terceiros no site principal.

## Por quê
O cookie de sessão é necessário para manter o login ativo entre páginas. O cookie de moeda lembra sua última escolha para você não precisar refazer a cada visita.

## Duração
O cookie de sessão dura 30 dias. O cookie de moeda dura 1 ano. Ambos podem ser limpos pelas configurações do navegador.

## Terceiros
Os gateways de pagamento (Woovi, Heleket) podem definir seus próprios cookies nas próprias páginas deles quando você conclui um pagamento. Esses cookies seguem a política do gateway.

## Consentimento
Os cookies que usamos são estritamente funcionais e dispensados do banner de consentimento da UE/Reino Unido. Por isso não exibimos banner.`,
  },
  refund: {
    title: "Política de Reembolso",
    updatedAt: "2026-05-30",
    body: `## Reposição primeiro
A maior parte dos problemas não é qualidade — é queda de seguidores ou questão de pacing. Os dois são cobertos pela reposição de 30 dias: sem reembolso, a gente recoloca os números.

## Quando reembolso se aplica
- O serviço não pôde ser entregue (a conta-alvo ou publicação ficou privada, foi apagada ou bloqueada do nosso lado).
- O pedido foi duplicado por engano e cobramos duas vezes pelo mesmo pacote.
- Erro óbvio de cobrança (valor errado).

## Quando não se aplica
- Você mudou de ideia depois da entrega completa.
- A plataforma agiu contra a conta-alvo por outro motivo.
- Uma queda dentro de 30 dias para a qual a gente já ofereceu reposição.

## Como pedir
Abra um ticket de suporte pela conta ou escreva ao e-mail do rodapé com o ID do pedido. Respondemos em 48 horas. Reembolsos aprovados voltam pelo meio original em até 5 dias úteis para cartão e transferência, ou via transação cripto separada para pagamentos em cripto.`,
  },
  about: {
    title: "Sobre a Viralefy",
    updatedAt: "2026-05-30",
    body: `## O que fazemos
A Viralefy ajuda criadores, marcas e pequenos negócios a sair do "cold start" no Instagram e TikTok. Vendemos pacotes de seguidores, engajamento e visualizações, com foco em qualidade, pacing e preço honesto.

## Pra quem
Atendemos 60+ países nas Américas e na Europa (SEPA). Cada mercado tem sua página no idioma e moeda locais.

## Nossa promessa
- Nunca pedimos senha.
- Nada de bots que somem na semana seguinte.
- Garantia de reposição de 30 dias.
- Atendimento humano de verdade.

## Contato
O sistema de tickets da conta é o caminho mais rápido. E-mail no rodapé.`,
  },
  contact: {
    title: "Contato",
    updatedAt: "2026-05-30",
    body: `## Mais rápido
O sistema de tickets da conta. Faça login, abra um ticket — respondemos no seu idioma em até 24 horas úteis.

## E-mail
support@viralefy.com — mais lento que ticket porque os tickets têm prioridade.

## O que incluir
- ID do pedido (visível na conta).
- Descrição curta do que aconteceu.
- Prints se for problema de entrega.

## O que não fazemos
Não pedimos senha. Não atendemos por telefone. Não emitimos reembolso fora da política.`,
  },
};

export const LEGAL: Partial<Record<LangCode, Record<LegalSlug, LegalDoc>>> = {
  en: EN, pt: PT, es: EN, es_AR: EN,
  fr: EN, de: EN, it: EN, nl: EN,
};

export function legalDoc(lang: LangCode, slug: LegalSlug): LegalDoc {
  const pack = LEGAL[lang] ?? EN;
  return pack[slug];
}
