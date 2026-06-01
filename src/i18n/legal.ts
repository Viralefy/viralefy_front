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
    updatedAt: "2026-05-31",
    body: `## Refill first
Most issues with follower / engagement / view packages are not a quality issue but a follower-drop or pacing question. Both are covered by our 30-day refill — no refund needed, we just top your numbers back up.

## Account recovery — full guarantee
Account Recovery orders carry a stronger commitment: **full refund within 30 calendar days** if we do not recover the suspended, hacked or restricted account. The clock starts when payment confirms and the support ticket is opened in your account. We work the case for up to 30 days; if the account is not back online on day 30, the entire amount is refunded to the original payment method (card / bank / crypto). No questions asked, no fees retained.

This guarantee covers genuine recovery attempts only. It does not apply when the cause of the suspension turns out to be unrecoverable by negotiation (e.g. confirmed CSAM, OFAC sanctions match, full-state takedown).

## BMs / aged profiles / email packs
Marketplace items (Facebook BMs, aged Instagram/TikTok profiles, validated email lists) are delivered as-is. Refunds apply only when the item never delivered or arrived materially different from the listing tier (e.g. follower count more than 20% short, BM banned at first login).

## When a refund applies (other categories)
- The service could not be delivered (the target account or post was private, deleted or blocked at our end).
- The order was duplicated by accident and we charged twice for the same package.
- An obvious billing mistake (wrong amount).

## When a refund does not apply
- You changed your mind after delivery completed.
- The platform took action against the target account for a separate reason.
- A drop within 30 days that we already offered to refill.

## How to request
Open the support ticket that opens automatically with your order, or write to the email in the footer with the order ID. We respond within 48 hours. Approved refunds land back on the original payment method within 5 business days for card and bank, or by separate crypto transaction for crypto.`,
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

const ES: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Política de Privacidad",
    updatedAt: "2026-05-30",
    body: `## Quiénes somos
Viralefy es operada por el equipo que gestiona viralefy.com. Ofrecemos servicios de crecimiento en redes sociales para Instagram y TikTok.

## Qué recopilamos
Recopilamos los datos que usted nos proporciona en el checkout (nombre, correo electrónico, el @ público de la cuenta objetivo, la URL pública de cualquier publicación contratada) y los datos necesarios para procesar pagos (moneda, método de pago, referencia de transacción del gateway). Nunca le pedimos ni almacenamos la contraseña de su cuenta.

## Cómo los usamos
Los datos personales se utilizan para (a) entregar el servicio contratado, (b) emitir facturas y recibos, (c) responder tickets de soporte y (d) enviar correos transaccionales (confirmación de pedido, aviso de reembolso). No vendemos ni compartimos sus datos con terceros con fines de marketing.

## Subprocesadores
Utilizamos: un procesador de pagos (Woovi para BRL, Heleket para cripto), un proveedor de correo transaccional (Resend), un proveedor de hosting (Hetzner) y una CDN (Cloudflare). Cada subprocesador trata los datos estrictamente para la finalidad técnica indicada.

## Sus derechos
Puede solicitar la exportación o supresión de sus datos en cualquier momento escribiendo al soporte. Las supresiones se atienden en un plazo de 30 días. Algunos registros (facturas) deben conservarse durante los periodos legales de contabilidad.

## Seguridad
Todo el tráfico se cifra en tránsito (TLS). Las contraseñas (de la cuenta Viralefy, no de su Instagram/TikTok) se almacenan con hash bcrypt. Los datos de pago los procesa el gateway y nunca pasan por nuestros servidores.

## Cookies
Consulte la Política de Cookies. Usamos una cookie de sesión mínima y ninguna cookie de marketing de terceros en el sitio principal.

## Contacto
Escriba al soporte mediante el sistema de tickets de la cuenta o al correo indicado en el pie de página.`,
  },
  terms: {
    title: "Términos del Servicio",
    updatedAt: "2026-05-30",
    body: `## Aceptación
Al comprar un servicio en Viralefy usted acepta estos términos. Si no está de acuerdo, no compre.

## Descripción del servicio
Viralefy entrega seguidores, "me gusta", visualizaciones y engagement relacionado para cuentas y publicaciones públicas de Instagram y TikTok. No accedemos a su cuenta; nunca le pediremos su contraseña. Los plazos de entrega son estimaciones, no garantías.

## Elegibilidad
Debe tener 18 años o más. La cuenta o publicación objetivo debe ser pública en el momento de la entrega y cumplir las normas de la plataforma subyacente (Instagram, TikTok). Nos reservamos el derecho a rechazar o cancelar pedidos dirigidos a contenido que infrinja las reglas de la plataforma o la ley aplicable.

## Reembolsos y reposiciones
La garantía de reposición de 30 días cubre los paquetes de seguidores y engagement. La política de reembolso se describe por separado en "Política de Reembolso".

## Pago
Los precios se muestran incluyendo los impuestos aplicables para la moneda mostrada. El pago se captura en el checkout. Los pagos en cripto son definitivos una vez confirmados en la cadena.

## Sin afiliación con plataformas
Viralefy no está afiliada a Instagram, TikTok ni Meta Platforms. Somos un servicio independiente de terceros.

## Limitación de responsabilidad
Viralefy no es responsable de las acciones que las plataformas subyacentes puedan tomar contra su cuenta. El uso del servicio es bajo su propio riesgo.

## Cambios
Podemos actualizar estos términos. La fecha de "actualizado el" en la parte superior se moverá. El uso continuado tras un cambio cuenta como aceptación.

## Ley aplicable
Estos términos se rigen por la ley del lugar donde Viralefy está registrada. Las disputas se someten al tribunal competente de dicho lugar.`,
  },
  cookies: {
    title: "Política de Cookies",
    updatedAt: "2026-05-30",
    body: `## Qué usamos
Viralefy usa una cookie esencial para mantener su sesión iniciada (\`viralefy_token\`) y una cookie de preferencia para la selección de moneda. No establecemos cookies de publicidad o seguimiento de terceros en el sitio principal.

## Por qué
La cookie de token es necesaria para mantener su sesión activa entre páginas. La cookie de moneda recuerda su última elección para que no tenga que volver a seleccionarla en cada visita.

## Duración
La cookie de sesión dura 30 días. La cookie de moneda dura 1 año. Ambas pueden borrarse desde la configuración del navegador en cualquier momento.

## Terceros
Las pasarelas de pago (Woovi, Heleket) pueden establecer sus propias cookies en sus páginas cuando complete un pago. Esas cookies se rigen por la política de privacidad de la pasarela, no por la nuestra.

## Consentimiento
Las cookies que utilizamos son estrictamente funcionales y están exentas del requisito de banner de consentimiento de la UE/Reino Unido. Por ese motivo no mostramos banner.`,
  },
  refund: {
    title: "Política de Reembolso",
    updatedAt: "2026-05-30",
    body: `## Primero, reposición
La mayoría de las incidencias no son un problema de calidad sino una caída de seguidores o una cuestión de pacing. Ambas están cubiertas por nuestra reposición de 30 días: no hace falta reembolso, simplemente reponemos los números.

## Cuándo aplica un reembolso
- El servicio no pudo entregarse (la cuenta o publicación objetivo estaba privada, fue eliminada o bloqueada en nuestro lado).
- El pedido se duplicó por error y cobramos dos veces el mismo paquete.
- Un error de facturación evidente (importe incorrecto).

## Cuándo no aplica
- Cambió de opinión después de completarse la entrega.
- La plataforma tomó medidas contra la cuenta objetivo por un motivo independiente.
- Una caída dentro de los 30 días para la que ya ofrecimos reposición.

## Cómo solicitarlo
Abra un ticket de soporte desde su cuenta o escriba al correo del pie de página con el ID del pedido. Respondemos en un plazo de 48 horas. Los reembolsos aprobados se devuelven al método de pago original en un plazo de 5 días hábiles para tarjeta y banco, o mediante una transacción cripto separada en el caso de cripto.`,
  },
  about: {
    title: "Sobre Viralefy",
    updatedAt: "2026-05-30",
    body: `## Qué hacemos
Viralefy ayuda a creadores, marcas y pequeñas empresas a superar el problema del arranque en frío en Instagram y TikTok. Vendemos paquetes de seguidores, engagement y visualizaciones, con foco en calidad, pacing y precios honestos.

## A quién servimos
Operamos en más de 60 países en América y Europa (SEPA). Cada mercado tiene su propia página en el idioma y la moneda locales.

## Nuestra promesa
- Nunca se pide contraseña.
- Nada de bots que desaparecen a la semana siguiente.
- Garantía de reposición de 30 días.
- Soporte humano de verdad.

## Contacto
El sistema de tickets desde la cuenta es la vía más rápida. El correo está en el pie de página.`,
  },
  contact: {
    title: "Contactar con soporte",
    updatedAt: "2026-05-30",
    body: `## Vía más rápida
El sistema de tickets desde la cuenta. Inicie sesión, abra un ticket — respondemos en su idioma en un plazo de 24 horas hábiles.

## Correo electrónico
support@viralefy.com — más lento que el sistema de tickets porque priorizamos los tickets.

## Qué incluir
- El ID del pedido (visible en su cuenta).
- Una breve descripción de lo ocurrido.
- Capturas de pantalla si es una incidencia de entrega.

## Qué no hacemos
No pedimos contraseñas. No tenemos línea telefónica. No emitimos reembolsos fuera de la política de reembolso.`,
  },
};

const FR: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Politique de confidentialité",
    updatedAt: "2026-05-30",
    body: `## Qui nous sommes
Viralefy est exploitée par l'équipe qui gère viralefy.com. Nous fournissons des services de croissance sur les réseaux sociaux pour Instagram et TikTok.

## Ce que nous collectons
Nous collectons les données que vous nous fournissez au moment du paiement (nom, e-mail, le @ public du compte ciblé, l'URL publique de toute publication concernée par votre commande) ainsi que les données nécessaires au traitement des paiements (devise, moyen de paiement, référence de transaction du prestataire). Nous ne vous demandons jamais et ne stockons jamais le mot de passe de votre compte.

## Comment nous les utilisons
Les données personnelles servent à (a) livrer le service acheté, (b) émettre des factures et des reçus, (c) répondre aux tickets de support et (d) envoyer des e-mails transactionnels (confirmation de commande, avis de remboursement). Nous ne vendons ni ne partageons vos données avec des tiers à des fins de marketing.

## Sous-traitants
Nous utilisons : un prestataire de paiement (Woovi pour le BRL, Heleket pour la crypto), un fournisseur d'e-mails transactionnels (Resend), un hébergeur (Hetzner) et un CDN (Cloudflare). Chaque sous-traitant traite les données strictement pour la finalité technique indiquée.

## Vos droits
Vous pouvez demander l'exportation ou la suppression de vos données à tout moment en écrivant au support. Les suppressions sont effectuées sous 30 jours. Certains documents (factures) doivent être conservés pendant les durées légales en matière comptable.

## Sécurité
Tout le trafic est chiffré en transit (TLS). Les mots de passe (du compte Viralefy, pas de votre Instagram/TikTok) sont hachés avec bcrypt. Les données de paiement sont traitées par le prestataire et ne transitent jamais par nos serveurs.

## Cookies
Voir la Politique relative aux cookies. Nous utilisons un cookie de session minimal et aucun cookie de marketing tiers sur le site principal.

## Contact
Écrivez au support via le système de tickets dans votre compte ou à l'adresse e-mail indiquée en pied de page.`,
  },
  terms: {
    title: "Conditions générales d'utilisation",
    updatedAt: "2026-05-30",
    body: `## Acceptation
En achetant un service auprès de Viralefy, vous acceptez ces conditions. Si vous n'êtes pas d'accord, n'achetez pas.

## Description du service
Viralefy livre des abonnés, des likes, des vues et de l'engagement associé à des comptes et publications publics Instagram et TikTok. Nous n'accédons pas à votre compte ; nous ne vous demandons jamais votre mot de passe. Les délais de livraison sont des estimations et non des garanties.

## Éligibilité
Vous devez avoir 18 ans ou plus. Le compte ou la publication ciblé(e) doit être public(que) au moment de la livraison et respecter les règles de la plateforme sous-jacente (Instagram, TikTok). Nous nous réservons le droit de refuser ou d'annuler toute commande visant du contenu qui enfreint les règles de la plateforme ou la loi applicable.

## Remboursements et recharges
La garantie de recharge de 30 jours couvre les packs d'abonnés et d'engagement. La politique de remboursement est décrite séparément dans la "Politique de Remboursement".

## Paiement
Les prix sont affichés taxes comprises pour la devise affichée. Le paiement est prélevé au moment du checkout. Les paiements en crypto sont définitifs une fois confirmés sur la chaîne.

## Absence d'affiliation aux plateformes
Viralefy n'est affiliée ni à Instagram, ni à TikTok, ni à Meta Platforms. Nous sommes un service tiers indépendant.

## Limitation de responsabilité
Viralefy n'est pas responsable des mesures prises par les plateformes sous-jacentes à l'encontre de votre compte. L'utilisation du service se fait à vos propres risques.

## Modifications
Nous pouvons mettre à jour ces conditions. La date "mis à jour le" en haut sera modifiée. L'utilisation continue après une modification vaut acceptation.

## Loi applicable
Ces conditions sont régies par la loi du lieu d'enregistrement de Viralefy. Les litiges relèvent du tribunal compétent de ce ressort.`,
  },
  cookies: {
    title: "Politique relative aux cookies",
    updatedAt: "2026-05-30",
    body: `## Ce que nous utilisons
Viralefy utilise un cookie essentiel pour vous garder connecté (\`viralefy_token\`) et un cookie de préférence pour la sélection de la devise. Aucun cookie de publicité ou de suivi tiers n'est déposé sur le site principal.

## Pourquoi
Le cookie de jeton est nécessaire pour maintenir votre session active d'une page à l'autre. Le cookie de devise mémorise votre dernier choix afin que vous n'ayez pas à le refaire à chaque visite.

## Durée de vie
Le cookie de session dure 30 jours. Le cookie de devise dure 1 an. Tous deux peuvent être supprimés à tout moment depuis les paramètres de votre navigateur.

## Tiers
Les prestataires de paiement (Woovi, Heleket) peuvent déposer leurs propres cookies sur leurs propres pages lorsque vous finalisez un paiement. Ces cookies relèvent de la politique de confidentialité du prestataire, pas de la nôtre.

## Consentement
Les cookies que nous utilisons sont strictement fonctionnels et exemptés de l'exigence de bannière de consentement UE/Royaume-Uni. C'est pour cette raison que nous n'affichons pas de bannière.`,
  },
  refund: {
    title: "Politique de remboursement",
    updatedAt: "2026-05-30",
    body: `## La recharge d'abord
La plupart des problèmes ne sont pas un problème de qualité mais une chute d'abonnés ou une question de pacing. Les deux sont couverts par notre recharge de 30 jours — pas besoin de remboursement, nous remettons simplement vos chiffres à niveau.

## Quand un remboursement s'applique
- Le service n'a pas pu être livré (le compte ou la publication ciblé(e) était privé(e), supprimé(e) ou bloqué(e) de notre côté).
- La commande a été dupliquée par erreur et nous avons facturé deux fois le même pack.
- Une erreur de facturation manifeste (montant incorrect).

## Quand un remboursement ne s'applique pas
- Vous avez changé d'avis après la fin de la livraison.
- La plateforme a pris des mesures contre le compte ciblé pour une raison distincte.
- Une chute dans les 30 jours pour laquelle nous avons déjà proposé une recharge.

## Comment demander
Ouvrez un ticket de support depuis votre compte ou écrivez à l'adresse e-mail figurant en pied de page en indiquant l'ID de commande. Nous répondons sous 48 heures. Les remboursements approuvés reviennent sur le moyen de paiement d'origine sous 5 jours ouvrés pour la carte et le virement bancaire, ou par transaction crypto séparée pour la crypto.`,
  },
  about: {
    title: "À propos de Viralefy",
    updatedAt: "2026-05-30",
    body: `## Ce que nous faisons
Viralefy aide les créateurs, les marques et les petites entreprises à sortir du problème du démarrage à froid sur Instagram et TikTok. Nous vendons des packs d'abonnés, d'engagement et de vues, en mettant l'accent sur la qualité, le pacing et des prix honnêtes.

## À qui nous nous adressons
Nous livrons dans plus de 60 pays en Amériques et en Europe (SEPA). Chaque marché dispose de sa propre page dans la langue et la devise locales.

## Notre promesse
- Aucun mot de passe demandé, jamais.
- Pas de bots qui disparaissent la semaine suivante.
- Garantie de recharge de 30 jours.
- Un support assuré par de vrais humains.

## Contact
Le système de tickets dans votre compte est le chemin le plus rapide. L'e-mail figure en pied de page.`,
  },
  contact: {
    title: "Contacter le support",
    updatedAt: "2026-05-30",
    body: `## Le plus rapide
Le système de tickets dans votre compte. Connectez-vous, ouvrez un ticket — nous répondons dans votre langue sous 24 heures ouvrées.

## E-mail
support@viralefy.com — plus lent que le système de tickets car nous traitons les tickets en priorité.

## Ce qu'il faut inclure
- L'ID de commande (visible dans votre compte).
- Une brève description de ce qui s'est passé.
- Des captures d'écran s'il s'agit d'un problème de livraison.

## Ce que nous ne faisons pas
Nous ne demandons pas de mots de passe. Nous n'avons pas de ligne téléphonique. Nous n'effectuons pas de remboursements en dehors de la politique de remboursement.`,
  },
};

const DE: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Datenschutzerklärung",
    updatedAt: "2026-05-30",
    body: `## Wer wir sind
Viralefy wird vom Team betrieben, das viralefy.com verantwortet. Wir bieten Wachstumsdienste für Instagram und TikTok an.

## Was wir erheben
Wir erheben die Daten, die Sie uns beim Checkout angeben (Name, E-Mail-Adresse, den öffentlichen @-Namen des Zielkontos, die öffentliche URL etwaiger bestellter Beiträge) sowie die Daten, die wir zur Zahlungsabwicklung benötigen (Währung, Zahlungsmethode, Transaktionsreferenz des Gateways). Wir fragen niemals nach Ihrem Konto-Passwort und speichern es auch nicht.

## Wie wir die Daten verwenden
Die personenbezogenen Daten werden verwendet, um (a) die von Ihnen gekaufte Leistung zu erbringen, (b) Rechnungen und Belege auszustellen, (c) Support-Tickets zu beantworten und (d) Transaktions-E-Mails zu versenden (Bestellbestätigung, Erstattungsmitteilung). Wir verkaufen Ihre Daten nicht und geben sie nicht zu Marketingzwecken an Dritte weiter.

## Auftragsverarbeiter
Wir nutzen: einen Zahlungsdienstleister (Woovi für BRL, Heleket für Krypto), einen Anbieter für Transaktions-E-Mails (Resend), einen Hosting-Anbieter (Hetzner) sowie ein CDN (Cloudflare). Jeder Auftragsverarbeiter verarbeitet Daten ausschließlich für den angegebenen technischen Zweck.

## Ihre Rechte
Sie können jederzeit Export oder Löschung Ihrer Daten beantragen, indem Sie sich an den Support wenden. Löschungen werden innerhalb von 30 Tagen umgesetzt. Bestimmte Unterlagen (Rechnungen) müssen für gesetzliche Aufbewahrungsfristen vorgehalten werden.

## Sicherheit
Der gesamte Datenverkehr ist während der Übertragung verschlüsselt (TLS). Passwörter (für das Viralefy-Konto, nicht für Ihr Instagram/TikTok) werden mit bcrypt gehasht. Zahlungsdaten werden vom Gateway verarbeitet und berühren unsere Server zu keinem Zeitpunkt.

## Cookies
Siehe Cookie-Richtlinie. Wir verwenden ein minimales Sitzungs-Cookie und keine Marketing-Cookies von Drittanbietern auf der Hauptseite.

## Kontakt
Wenden Sie sich über das Ticket-System im Konto an den Support oder per E-Mail an die im Footer angegebene Adresse.`,
  },
  terms: {
    title: "Nutzungsbedingungen",
    updatedAt: "2026-05-30",
    body: `## Vertragsannahme
Mit dem Kauf einer Leistung von Viralefy stimmen Sie diesen Bedingungen zu. Wenn Sie nicht zustimmen, kaufen Sie bitte nicht.

## Leistungsbeschreibung
Viralefy liefert Follower, Likes, Views und vergleichbares Engagement für öffentlich sichtbare Konten und Beiträge auf Instagram und TikTok. Wir greifen nicht auf Ihr Konto zu und fragen niemals nach Ihrem Passwort. Lieferzeiten sind Schätzungen und keine Zusicherungen.

## Berechtigung
Sie müssen mindestens 18 Jahre alt sein. Das Zielkonto bzw. der Zielbeitrag muss zum Zeitpunkt der Lieferung öffentlich sein und den Regeln der zugrunde liegenden Plattform (Instagram, TikTok) entsprechen. Wir behalten uns vor, Bestellungen abzulehnen oder zu stornieren, die auf Inhalte abzielen, die gegen Plattformregeln oder geltendes Recht verstoßen.

## Erstattungen und Nachfüllungen
Eine 30-tägige Nachfüll-Garantie deckt Follower- und Engagement-Pakete ab. Die Erstattungsregelung ist gesondert in der "Erstattungsrichtlinie" beschrieben.

## Zahlung
Die Preise werden inklusive etwaiger Steuern in der angezeigten Währung dargestellt. Die Zahlung wird beim Checkout eingezogen. Krypto-Zahlungen sind nach On-Chain-Bestätigung endgültig.

## Keine Plattform-Affiliation
Viralefy steht in keiner Verbindung zu Instagram, TikTok oder Meta Platforms. Wir sind ein unabhängiger Drittanbieter.

## Haftungsbeschränkung
Viralefy haftet nicht für Maßnahmen, die die zugrunde liegenden Plattformen gegen Ihr Konto ergreifen. Die Nutzung des Dienstes erfolgt auf eigene Gefahr.

## Änderungen
Wir können diese Bedingungen aktualisieren. Das Datum "aktualisiert am" am Anfang wird entsprechend angepasst. Die weitere Nutzung nach einer Änderung gilt als Zustimmung.

## Anwendbares Recht
Diese Bedingungen unterliegen dem Recht des Sitzlandes von Viralefy. Streitigkeiten werden vor dem dort zuständigen Gericht ausgetragen.`,
  },
  cookies: {
    title: "Cookie-Richtlinie",
    updatedAt: "2026-05-30",
    body: `## Was wir verwenden
Viralefy verwendet ein essentielles Cookie, um Sie angemeldet zu halten (\`viralefy_token\`), und ein Präferenz-Cookie für die Währungsauswahl. Auf der Hauptseite werden keine Werbe- oder Tracking-Cookies von Drittanbietern gesetzt.

## Warum
Das Token-Cookie ist erforderlich, um Ihre Sitzung über Seiten hinweg aktiv zu halten. Das Währungs-Cookie merkt sich Ihre letzte Auswahl, damit Sie diese nicht bei jedem Besuch erneut treffen müssen.

## Lebensdauer
Das Sitzungs-Cookie hat eine Laufzeit von 30 Tagen. Das Währungs-Cookie hat eine Laufzeit von 1 Jahr. Beide können jederzeit über die Browsereinstellungen gelöscht werden.

## Dritte
Die Zahlungs-Gateways (Woovi, Heleket) können auf ihren eigenen Seiten eigene Cookies setzen, wenn Sie eine Zahlung abschließen. Diese unterliegen der Datenschutzerklärung des jeweiligen Gateways, nicht unserer.

## Einwilligung
Die von uns eingesetzten Cookies sind ausschließlich funktional und von der Bannerpflicht nach EU/UK-Recht ausgenommen. Aus diesem Grund zeigen wir kein Banner an.`,
  },
  refund: {
    title: "Erstattungsrichtlinie",
    updatedAt: "2026-05-30",
    body: `## Zuerst nachfüllen
Die meisten Anliegen sind keine Qualitätsprobleme, sondern Follower-Verluste oder eine Frage des Pacings. Beides ist durch unsere 30-tägige Nachfüllung abgedeckt — es ist keine Erstattung erforderlich, wir füllen Ihre Zahlen einfach wieder auf.

## Wann eine Erstattung gilt
- Die Leistung konnte nicht erbracht werden (das Zielkonto bzw. der Zielbeitrag war privat, gelöscht oder von unserer Seite blockiert).
- Die Bestellung wurde versehentlich doppelt ausgelöst und wir haben dasselbe Paket zweimal berechnet.
- Ein offensichtlicher Abrechnungsfehler (falscher Betrag).

## Wann keine Erstattung gilt
- Sie haben es sich nach abgeschlossener Lieferung anders überlegt.
- Die Plattform hat aus einem anderen Grund Maßnahmen gegen das Zielkonto ergriffen.
- Ein Rückgang innerhalb von 30 Tagen, für den wir bereits eine Nachfüllung angeboten haben.

## Wie Sie eine Erstattung beantragen
Öffnen Sie ein Support-Ticket in Ihrem Konto oder schreiben Sie an die im Footer angegebene E-Mail-Adresse unter Angabe der Bestell-ID. Wir antworten innerhalb von 48 Stunden. Genehmigte Erstattungen erfolgen über die ursprüngliche Zahlungsmethode innerhalb von 5 Werktagen bei Karte und Bank, bei Krypto über eine separate Krypto-Transaktion.`,
  },
  about: {
    title: "Über Viralefy",
    updatedAt: "2026-05-30",
    body: `## Was wir tun
Viralefy hilft Creators, Marken und kleinen Unternehmen, das Kaltstart-Problem auf Instagram und TikTok zu überwinden. Wir verkaufen Pakete für Follower, Engagement und Views — mit Fokus auf Qualität, Pacing und faire Preise.

## Wen wir bedienen
Wir liefern in über 60 Länder in Nord- und Südamerika sowie in Europa (SEPA). Jeder Markt hat seine eigene Seite in der jeweiligen Landessprache und Währung.

## Unser Versprechen
- Niemals ein Passwort erforderlich.
- Keine Bots, die nächste Woche wieder verschwinden.
- 30-tägige Nachfüll-Garantie.
- Echte Menschen im Support.

## Kontakt
Das Ticket-System im Konto ist der schnellste Weg. Die E-Mail-Adresse finden Sie im Footer.`,
  },
  contact: {
    title: "Support kontaktieren",
    updatedAt: "2026-05-30",
    body: `## Schnellster Weg
Das Ticket-System im Konto. Melden Sie sich an, eröffnen Sie ein Ticket — wir antworten in Ihrer Sprache innerhalb von 24 Geschäftsstunden.

## E-Mail
support@viralefy.com — langsamer als das Ticket-System, da wir Tickets priorisieren.

## Was Sie angeben sollten
- Die Bestell-ID (in Ihrem Konto sichtbar).
- Eine kurze Beschreibung des Vorfalls.
- Screenshots, sofern es sich um ein Lieferproblem handelt.

## Was wir nicht tun
Wir fragen nicht nach Passwörtern. Wir betreiben keine Telefonhotline. Wir leisten keine Erstattungen außerhalb der Erstattungsrichtlinie.`,
  },
};

const IT: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Informativa sulla privacy",
    updatedAt: "2026-05-30",
    body: `## Chi siamo
Viralefy è gestita dal team che opera viralefy.com. Forniamo servizi di crescita sui social media per Instagram e TikTok.

## Cosa raccogliamo
Raccogliamo i dati che Lei ci fornisce al checkout (nome, e-mail, l'@ pubblico dell'account target, l'URL pubblico di eventuali post oggetto dell'ordine) e i dati necessari per elaborare i pagamenti (valuta, metodo di pagamento, riferimento della transazione del gateway). Non chiediamo mai e non conserviamo mai la password del Suo account.

## Come li usiamo
I dati personali sono utilizzati per (a) erogare il servizio acquistato, (b) emettere fatture e ricevute, (c) rispondere ai ticket di supporto e (d) inviare e-mail transazionali (conferma d'ordine, avviso di rimborso). Non vendiamo né condividiamo i Suoi dati con terzi per finalità di marketing.

## Responsabili del trattamento
Utilizziamo: un processore di pagamento (Woovi per BRL, Heleket per cripto), un fornitore di e-mail transazionali (Resend), un fornitore di hosting (Hetzner) e una CDN (Cloudflare). Ogni responsabile del trattamento elabora i dati esclusivamente per la finalità tecnica indicata.

## I Suoi diritti
Può richiedere in qualsiasi momento l'esportazione o la cancellazione dei Suoi dati scrivendo al supporto. Le cancellazioni vengono evase entro 30 giorni. Alcuni documenti (fatture) devono essere conservati per i periodi previsti dalla normativa contabile.

## Sicurezza
Tutto il traffico è cifrato in transito (TLS). Le password (dell'account Viralefy, non del Suo Instagram/TikTok) sono memorizzate con hash bcrypt. I dati di pagamento sono elaborati dal gateway e non transitano mai sui nostri server.

## Cookie
Si veda l'Informativa sui cookie. Utilizziamo un cookie di sessione minimo e nessun cookie di marketing di terze parti sul sito principale.

## Contatti
Scriva al supporto tramite il sistema di ticket nell'account o all'e-mail indicata nel piè di pagina.`,
  },
  terms: {
    title: "Termini di servizio",
    updatedAt: "2026-05-30",
    body: `## Accettazione
Acquistando un servizio da Viralefy Lei accetta questi termini. In caso di disaccordo, La preghiamo di non procedere all'acquisto.

## Descrizione del servizio
Viralefy fornisce follower, like, visualizzazioni ed engagement correlato per account e pubblicazioni pubblicamente visibili su Instagram e TikTok. Non accediamo al Suo account; non chiediamo mai la Sua password. I tempi di consegna sono stime, non garanzie.

## Requisiti
Deve avere almeno 18 anni. L'account o il post target deve essere pubblico al momento della consegna e conformarsi alle regole della piattaforma sottostante (Instagram, TikTok). Ci riserviamo il diritto di rifiutare o cancellare ordini relativi a contenuti che violano le regole della piattaforma o la normativa applicabile.

## Rimborsi e ricariche
La garanzia di ricarica di 30 giorni copre i pacchetti di follower ed engagement. La politica dei rimborsi è descritta separatamente nella "Politica di Rimborso".

## Pagamento
I prezzi sono mostrati inclusi gli eventuali tributi applicabili per la valuta indicata. Il pagamento viene addebitato al checkout. I pagamenti in cripto sono definitivi una volta confermati on-chain.

## Nessuna affiliazione con le piattaforme
Viralefy non è affiliata a Instagram, TikTok o Meta Platforms. Siamo un servizio indipendente di terze parti.

## Limitazione di responsabilità
Viralefy non è responsabile delle azioni intraprese dalle piattaforme sottostanti nei confronti del Suo account. L'uso del servizio avviene a Suo rischio.

## Modifiche
Possiamo aggiornare questi termini. La data "aggiornato il" in alto verrà aggiornata di conseguenza. L'uso continuato dopo una modifica vale come accettazione.

## Legge applicabile
Questi termini sono regolati dalla legge del luogo in cui Viralefy è registrata. Le controversie sono devolute al foro competente di tale luogo.`,
  },
  cookies: {
    title: "Informativa sui cookie",
    updatedAt: "2026-05-30",
    body: `## Cosa usiamo
Viralefy utilizza un cookie essenziale per mantenerLa connessa (\`viralefy_token\`) e un cookie di preferenza per la selezione della valuta. Sul sito principale non vengono impostati cookie pubblicitari o di tracciamento di terze parti.

## Perché
Il cookie token è necessario per mantenere la sessione attiva tra le pagine. Il cookie della valuta ricorda la Sua ultima scelta in modo che non debba ripeterla a ogni visita.

## Durata
Il cookie di sessione dura 30 giorni. Il cookie della valuta dura 1 anno. Entrambi possono essere eliminati in qualsiasi momento dalle impostazioni del browser.

## Terze parti
I gateway di pagamento (Woovi, Heleket) possono impostare propri cookie sulle proprie pagine quando completa un pagamento. Tali cookie sono disciplinati dall'informativa del gateway, non dalla nostra.

## Consenso
I cookie che utilizziamo sono strettamente funzionali ed esenti dall'obbligo di banner di consenso UE/UK. Per questo motivo non mostriamo alcun banner.`,
  },
  refund: {
    title: "Politica di Rimborso",
    updatedAt: "2026-05-30",
    body: `## Prima la ricarica
La maggior parte dei problemi non riguarda la qualità, ma cali di follower o questioni di pacing. Entrambi sono coperti dalla nostra ricarica di 30 giorni — niente rimborso, ripristiniamo semplicemente i numeri.

## Quando si applica un rimborso
- Il servizio non ha potuto essere erogato (l'account o il post target era privato, eliminato o bloccato dal nostro lato).
- L'ordine è stato duplicato per errore e abbiamo addebitato due volte lo stesso pacchetto.
- Un errore di fatturazione evidente (importo errato).

## Quando non si applica
- Lei ha cambiato idea dopo che la consegna è stata completata.
- La piattaforma ha agito contro l'account target per un motivo distinto.
- Un calo entro i 30 giorni per cui abbiamo già offerto una ricarica.

## Come richiederlo
Apra un ticket di supporto dall'interno del Suo account o scriva all'e-mail nel piè di pagina indicando l'ID ordine. Rispondiamo entro 48 ore. I rimborsi approvati tornano sul metodo di pagamento originale entro 5 giorni lavorativi per carta e bonifico, oppure tramite una transazione cripto separata in caso di cripto.`,
  },
  about: {
    title: "Chi è Viralefy",
    updatedAt: "2026-05-30",
    body: `## Cosa facciamo
Viralefy aiuta creator, brand e piccole imprese a superare il problema dell'avvio a freddo su Instagram e TikTok. Vendiamo pacchetti di follower, engagement e visualizzazioni, con un focus su qualità, pacing e prezzi onesti.

## A chi ci rivolgiamo
Operiamo in oltre 60 Paesi tra Americhe ed Europa (SEPA). Ogni mercato ha la propria pagina nella lingua e nella valuta locali.

## La nostra promessa
- Nessuna password richiesta, mai.
- Niente bot che spariscono la settimana successiva.
- Garanzia di ricarica di 30 giorni.
- Persone vere a supporto.

## Contatti
Il sistema di ticket nell'account è la via più rapida. L'e-mail è nel piè di pagina.`,
  },
  contact: {
    title: "Contattare il supporto",
    updatedAt: "2026-05-30",
    body: `## Via più rapida
Il sistema di ticket nell'account. Effettui l'accesso, apra un ticket — rispondiamo nella Sua lingua entro 24 ore lavorative.

## E-mail
support@viralefy.com — più lento del sistema di ticket perché diamo priorità ai ticket.

## Cosa includere
- L'ID ordine (visibile nel Suo account).
- Una breve descrizione di cosa è accaduto.
- Screenshot se si tratta di un problema di consegna.

## Cosa non facciamo
Non chiediamo password. Non gestiamo una linea telefonica. Non emettiamo rimborsi al di fuori della politica di rimborso.`,
  },
};

const NL: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Privacybeleid",
    updatedAt: "2026-05-30",
    body: `## Wie wij zijn
Viralefy wordt beheerd door het team dat viralefy.com runt. Wij leveren groeidiensten voor sociale media op Instagram en TikTok.

## Wat wij verzamelen
Wij verzamelen de gegevens die u ons bij het afrekenen verstrekt (naam, e-mailadres, de openbare @-handle van uw doelaccount, de openbare URL van eventuele bestelde berichten) en de gegevens die wij nodig hebben om betalingen te verwerken (valuta, betaalmethode, transactiereferentie van de gateway). Wij vragen nooit om uw accountwachtwoord en slaan dit ook niet op.

## Hoe wij ze gebruiken
De persoonsgegevens worden gebruikt om (a) de door u gekochte dienst te leveren, (b) facturen en bonnen op te stellen, (c) supporttickets te beantwoorden en (d) transactionele e-mails te versturen (orderbevestiging, terugbetalingsmelding). Wij verkopen of delen uw gegevens niet met derden voor marketingdoeleinden.

## Subverwerkers
Wij gebruiken: een betaalprovider (Woovi voor BRL, Heleket voor crypto), een provider voor transactionele e-mails (Resend), een hostingprovider (Hetzner) en een CDN (Cloudflare). Elke subverwerker verwerkt gegevens strikt voor het vermelde technische doel.

## Uw rechten
U kunt op elk moment verzoeken om export of verwijdering van uw gegevens door contact op te nemen met support. Verwijderingen worden binnen 30 dagen uitgevoerd. Bepaalde stukken (facturen) moeten gedurende de wettelijke boekhoudkundige termijnen worden bewaard.

## Beveiliging
Alle verkeer wordt tijdens het transport versleuteld (TLS). Wachtwoorden (van het Viralefy-account, niet van uw Instagram/TikTok) worden met bcrypt gehasht. Betaalgegevens worden door de gateway verwerkt en komen nooit op onze servers.

## Cookies
Zie het Cookiebeleid. Wij gebruiken een minimale sessiecookie en geen marketingcookies van derden op de hoofdsite.

## Contact
Neem contact op met support via het ticketsysteem in uw account of via het e-mailadres in de voettekst.`,
  },
  terms: {
    title: "Algemene Voorwaarden",
    updatedAt: "2026-05-30",
    body: `## Akkoord
Door een dienst van Viralefy te kopen, gaat u akkoord met deze voorwaarden. Bent u het er niet mee eens, doe dan geen aankoop.

## Beschrijving van de dienst
Viralefy levert volgers, likes, weergaven en gerelateerde engagement aan publiek zichtbare Instagram- en TikTok-accounts en -berichten. Wij hebben geen toegang tot uw account; wij vragen nooit om uw wachtwoord. Levertijden zijn schattingen, geen garanties.

## Geschiktheid
U moet 18 jaar of ouder zijn. Het doelaccount of -bericht moet op het moment van levering openbaar zijn en moet voldoen aan de regels van het onderliggende platform (Instagram, TikTok). Wij behouden ons het recht voor om bestellingen voor inhoud die de regels van het platform of de toepasselijke wetgeving schendt te weigeren of te annuleren.

## Terugbetalingen en aanvullingen
Een aanvulgarantie van 30 dagen geldt voor volger- en engagementpakketten. Het terugbetalingsbeleid wordt apart beschreven onder "Terugbetalingsbeleid".

## Betaling
Prijzen worden weergegeven inclusief eventuele toepasselijke belastingen voor de getoonde valuta. De betaling wordt bij het afrekenen geïncasseerd. Cryptobetalingen zijn definitief zodra ze on-chain zijn bevestigd.

## Geen platformaffiliatie
Viralefy is niet gelieerd aan Instagram, TikTok of Meta Platforms. Wij zijn een onafhankelijke externe dienst.

## Beperking van aansprakelijkheid
Viralefy is niet aansprakelijk voor maatregelen die de onderliggende platforms tegen uw account nemen. Gebruik van de dienst is op eigen risico.

## Wijzigingen
Wij kunnen deze voorwaarden bijwerken. De datum "bijgewerkt op" bovenaan wordt aangepast. Voortgezet gebruik na een wijziging geldt als aanvaarding.

## Toepasselijk recht
Op deze voorwaarden is het recht van het land van vestiging van Viralefy van toepassing. Geschillen worden voorgelegd aan de aldaar bevoegde rechter.`,
  },
  cookies: {
    title: "Cookiebeleid",
    updatedAt: "2026-05-30",
    body: `## Wat wij gebruiken
Viralefy gebruikt één essentiële cookie om u ingelogd te houden (\`viralefy_token\`) en één voorkeurscookie voor de valutakeuze. Op de hoofdsite worden geen advertentie- of trackingcookies van derden geplaatst.

## Waarom
De tokencookie is nodig om uw sessie tussen pagina's actief te houden. De valutacookie onthoudt uw laatste keuze, zodat u die niet bij elk bezoek opnieuw hoeft te maken.

## Levensduur
De sessiecookie blijft 30 dagen geldig. De valutacookie blijft 1 jaar geldig. Beide kunnen op elk moment via de instellingen van uw browser worden gewist.

## Derden
De betalingsgateways (Woovi, Heleket) kunnen op hun eigen pagina's eigen cookies plaatsen wanneer u een betaling voltooit. Die vallen onder het privacybeleid van de gateway, niet onder het onze.

## Toestemming
De cookies die wij gebruiken zijn strikt functioneel en vrijgesteld van de toestemmingsbannerplicht in de EU/het VK. Daarom tonen wij geen banner.`,
  },
  refund: {
    title: "Terugbetalingsbeleid",
    updatedAt: "2026-05-30",
    body: `## Eerst aanvullen
De meeste problemen zijn geen kwaliteitsprobleem, maar een volgerafname of een kwestie van pacing. Beide worden gedekt door onze aanvulling van 30 dagen — geen terugbetaling nodig, wij vullen uw cijfers gewoon weer aan.

## Wanneer een terugbetaling geldt
- De dienst kon niet worden geleverd (het doelaccount of -bericht was privé, verwijderd of aan onze kant geblokkeerd).
- De bestelling is per ongeluk gedupliceerd en wij hebben hetzelfde pakket twee keer in rekening gebracht.
- Een duidelijke factureringsfout (verkeerd bedrag).

## Wanneer een terugbetaling niet geldt
- U bent van gedachten veranderd nadat de levering was voltooid.
- Het platform heeft om een afzonderlijke reden maatregelen tegen het doelaccount genomen.
- Een afname binnen 30 dagen waarvoor wij al een aanvulling hebben aangeboden.

## Hoe aan te vragen
Open een supportticket vanuit uw account of stuur een e-mail naar het adres in de voettekst met het ordernummer. Wij reageren binnen 48 uur. Goedgekeurde terugbetalingen komen binnen 5 werkdagen terug op de oorspronkelijke betaalmethode voor kaart en bank, of via een aparte cryptotransactie voor crypto.`,
  },
  about: {
    title: "Over Viralefy",
    updatedAt: "2026-05-30",
    body: `## Wat wij doen
Viralefy helpt creators, merken en kleine bedrijven om los te komen van het koudestartprobleem op Instagram en TikTok. Wij verkopen pakketten met volgers, engagement en weergaven, met focus op kwaliteit, pacing en eerlijke prijzen.

## Voor wie
Wij leveren in meer dan 60 landen in Noord- en Zuid-Amerika en Europa (SEPA). Elke markt heeft een eigen pagina in de lokale taal en valuta.

## Onze belofte
- Nooit een wachtwoord nodig.
- Geen bots die volgende week weer verdwijnen.
- Aanvulgarantie van 30 dagen.
- Echte mensen in support.

## Contact
Het ticketsysteem in uw account is de snelste route. Het e-mailadres staat in de voettekst.`,
  },
  contact: {
    title: "Contact opnemen met support",
    updatedAt: "2026-05-30",
    body: `## Snelste route
Het ticketsysteem in uw account. Log in, open een ticket — wij antwoorden in uw taal binnen 24 werkuren.

## E-mail
support@viralefy.com — trager dan het ticketsysteem, omdat wij tickets eerst behandelen.

## Wat te vermelden
- Het ordernummer (zichtbaar in uw account).
- Een korte beschrijving van wat er is gebeurd.
- Schermafbeeldingen als het om een leveringsprobleem gaat.

## Wat wij niet doen
Wij vragen niet om wachtwoorden. Wij hebben geen telefoonlijn. Wij betalen niet terug buiten het terugbetalingsbeleid om.`,
  },
};

const RU: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Политика конфиденциальности",
    updatedAt: "2026-05-30",
    body: `## Кто мы
Viralefy управляется командой, которая ведёт viralefy.com. Мы предоставляем услуги роста в социальных сетях для Instagram и TikTok.

## Что мы собираем
Мы собираем данные, которые вы предоставляете при оформлении заказа (имя, e-mail, публичный @-ник целевого аккаунта, публичный URL любого поста, на который оформлен заказ), и данные, необходимые для обработки платежей (валюта, способ оплаты, идентификатор транзакции платёжного шлюза). Мы никогда не запрашиваем и не храним пароль от вашего аккаунта.

## Как мы их используем
Персональные данные используются для того, чтобы (а) оказать приобретённую вами услугу, (б) выставить счета и чеки, (в) отвечать на тикеты поддержки и (г) отправлять транзакционные письма (подтверждение заказа, уведомление о возврате). Мы не продаём и не передаём ваши данные третьим лицам в маркетинговых целях.

## Субподрядчики
Мы используем: платёжного провайдера (Woovi для BRL, Heleket для криптовалют), сервис транзакционной рассылки (Resend), хостинг-провайдера (Hetzner) и CDN (Cloudflare). Каждый субподрядчик обрабатывает данные строго в указанных технических целях.

## Ваши права
Вы можете в любой момент запросить экспорт или удаление ваших данных, написав в поддержку. Удаления исполняются в течение 30 дней. Некоторые документы (счета) подлежат хранению в течение установленных законом сроков бухгалтерского учёта.

## Безопасность
Весь трафик шифруется при передаче (TLS). Пароли (от аккаунта Viralefy, а не от вашего Instagram/TikTok) хешируются с помощью bcrypt. Платёжные данные обрабатываются платёжным шлюзом и никогда не попадают на наши серверы.

## Cookies
См. Политику cookies. На основном сайте мы используем минимальный сессионный cookie и не используем сторонние маркетинговые cookies.

## Контакты
Напишите в поддержку через систему тикетов в аккаунте или на e-mail, указанный в подвале сайта.`,
  },
  terms: {
    title: "Условия обслуживания",
    updatedAt: "2026-05-30",
    body: `## Согласие
Покупая услугу у Viralefy, вы соглашаетесь с настоящими условиями. Если вы с ними не согласны — не оформляйте покупку.

## Описание услуги
Viralefy предоставляет подписчиков, лайки, просмотры и связанную вовлечённость для публично видимых аккаунтов и публикаций в Instagram и TikTok. Мы не получаем доступ к вашему аккаунту и никогда не запрашиваем пароль. Сроки доставки являются ориентировочными и не являются гарантиями.

## Требования к пользователю
Вам должно быть не менее 18 лет. Целевой аккаунт или публикация должны быть публичными на момент доставки и соответствовать правилам соответствующей платформы (Instagram, TikTok). Мы оставляем за собой право отклонить или отменить заказ, направленный на контент, нарушающий правила платформы или применимое законодательство.

## Возвраты и восполнения
30-дневная гарантия восполнения распространяется на пакеты подписчиков и вовлечённости. Политика возврата средств описана отдельно в документе «Политика возврата».

## Оплата
Цены указываются с учётом применимых налогов в отображаемой валюте. Платёж списывается при оформлении заказа. Платежи в криптовалюте считаются окончательными после подтверждения транзакции в сети.

## Отсутствие аффилиации с платформами
Viralefy не аффилирована с Instagram, TikTok или Meta Platforms. Мы — независимый сторонний сервис.

## Ограничение ответственности
Viralefy не несёт ответственности за действия, которые соответствующие платформы могут предпринять в отношении вашего аккаунта. Использование услуги осуществляется на ваш собственный риск.

## Изменения
Мы можем обновлять настоящие условия. Дата «обновлено» в начале документа будет соответствующим образом перемещена. Продолжение использования после внесения изменений считается их принятием.

## Применимое право
Настоящие условия регулируются законодательством места регистрации Viralefy. Споры подлежат рассмотрению в компетентном суде по месту регистрации.`,
  },
  cookies: {
    title: "Политика cookies",
    updatedAt: "2026-05-30",
    body: `## Что мы используем
Viralefy использует один обязательный cookie для поддержания вашей сессии (\`viralefy_token\`) и один cookie настройки — для выбора валюты. На основном сайте сторонние рекламные или трекинговые cookies не устанавливаются.

## Зачем
Сессионный cookie необходим для поддержания вашей авторизации между страницами. Cookie валюты запоминает последний выбранный вами вариант, чтобы вам не приходилось задавать его заново при каждом визите.

## Срок жизни
Сессионный cookie действует 30 дней. Cookie валюты — 1 год. Оба можно в любой момент удалить через настройки браузера.

## Третьи стороны
Платёжные шлюзы (Woovi, Heleket) могут устанавливать собственные cookies на своих страницах при завершении оплаты. Они регулируются политикой конфиденциальности соответствующего шлюза, а не нашей.

## Согласие
Используемые нами cookies являются строго функциональными и освобождены от требования о баннере согласия ЕС/Великобритании. По этой причине мы не показываем такой баннер.`,
  },
  refund: {
    title: "Политика возврата",
    updatedAt: "2026-05-30",
    body: `## Сначала восполнение
Большинство обращений связаны не с качеством, а с просадкой подписчиков или вопросами темпа. И то и другое покрывается нашей 30-дневной гарантией восполнения — возврат не требуется, мы просто возвращаем счётчики к исходному значению.

## Когда возврат применяется
- Услуга не могла быть оказана (целевой аккаунт или публикация стали приватными, были удалены или заблокированы с нашей стороны).
- Заказ был случайно продублирован, и мы списали оплату за один и тот же пакет дважды.
- Очевидная ошибка биллинга (неверная сумма).

## Когда возврат не применяется
- Вы передумали уже после полной доставки.
- Платформа предприняла действия в отношении целевого аккаунта по независящей от нас причине.
- Просадка в течение 30 дней, для которой мы уже предложили восполнение.

## Как запросить
Откройте тикет поддержки из своего аккаунта или напишите на e-mail в подвале сайта, указав идентификатор заказа. Мы отвечаем в течение 48 часов. Одобренные возвраты поступают тем же способом оплаты в течение 5 рабочих дней для карты и банковского перевода или отдельной криптовалютной транзакцией — для криптоплатежей.`,
  },
  about: {
    title: "О Viralefy",
    updatedAt: "2026-05-30",
    body: `## Чем мы занимаемся
Viralefy помогает авторам, брендам и малому бизнесу выйти из проблемы «холодного старта» в Instagram и TikTok. Мы продаём пакеты подписчиков, вовлечённости и просмотров с упором на качество, темп подачи и честное ценообразование.

## Кому мы служим
Мы работаем в более чем 60 странах Америки и Европы (SEPA). У каждого рынка своя страница на местном языке и в местной валюте.

## Наше обещание
- Никогда не требуем пароль.
- Никаких ботов, которые исчезают на следующей неделе.
- 30-дневная гарантия восполнения.
- В поддержке отвечают живые люди.

## Контакты
Система тикетов в аккаунте — самый быстрый способ. E-mail указан в подвале сайта.`,
  },
  contact: {
    title: "Связаться с поддержкой",
    updatedAt: "2026-05-30",
    body: `## Самый быстрый путь
Система тикетов в аккаунте. Войдите, откройте тикет — мы отвечаем на вашем языке в течение 24 рабочих часов.

## E-mail
support@viralefy.com — медленнее системы тикетов, поскольку тикеты обрабатываются в приоритете.

## Что приложить
- Идентификатор заказа (виден в вашем аккаунте).
- Краткое описание произошедшего.
- Скриншоты, если речь о проблеме с доставкой.

## Чего мы не делаем
Мы не запрашиваем пароли. У нас нет телефонной линии. Мы не возвращаем средства вне рамок политики возврата.`,
  },
};

export const LEGAL: Partial<Record<LangCode, Record<LegalSlug, LegalDoc>>> = {
  en: EN, pt: PT,
  es: ES, es_AR: ES,
  fr: FR, de: DE, it: IT, nl: NL,
  ru: RU,
};

export function legalDoc(lang: LangCode, slug: LegalSlug): LegalDoc {
  const pack = LEGAL[lang] ?? EN;
  return pack[slug];
}
