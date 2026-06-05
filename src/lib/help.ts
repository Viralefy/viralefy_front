// Help center content. EN-only por enquanto — i18n quando o copy estabilizar.

export type HelpCategory = "buying" | "delivery" | "payments" | "safety" | "account";

export type HelpTopic = {
  slug: string;
  title: string;
  category: HelpCategory;
  intro: string;
  sections: { heading: string; body: string }[];
  relatedSlugs: string[];
  updatedAt: string;
};

const UPDATED = "2026-06-05";

export const HELP_CATEGORIES: { code: HelpCategory; label: string; blurb: string }[] = [
  { code: "buying", label: "Buying & plans", blurb: "Choosing the right plan and placing your first order." },
  { code: "delivery", label: "Delivery & quality", blurb: "How long orders take and what to expect after payment." },
  { code: "payments", label: "Payments", blurb: "Accepted methods, crypto, PIX and currency display." },
  { code: "safety", label: "Safety & privacy", blurb: "How we protect your account and your data." },
  { code: "account", label: "Account & support", blurb: "Refunds, ticket access and order history." },
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: "how-to-buy",
    title: "How to buy on Viralefy",
    category: "buying",
    updatedAt: UPDATED,
    intro:
      "Viralefy is a marketplace for Instagram and TikTok engagement plans, plus a small catalogue of digital assets. The buying flow is the same for every product: pick a country storefront, open a plan, set the quantity, paste the public username or URL you want to boost, choose a payment method, and finish checkout. There is no signup gate. You receive a one-time link to your order page and a magic link by email so you can come back later, follow progress, open tickets and download invoices without ever creating a password.",
    sections: [
      {
        heading: "Pick a storefront and plan",
        body: "Each country page lists the engagement plans available in that market, with prices already adjusted for the local currency and the categories most relevant to creators in that region. You can also browse from the home page or from the global catalogue. Open any plan card to see what it includes: type of engagement (followers, likes, views, comments), the volume range, the refill window, and the estimated delivery time. Plans never promise a specific ranking outcome on Instagram or TikTok — they describe a publicly visible engagement boost, and the cards make that scope clear so you know exactly what you are buying before you reach checkout.",
      },
      {
        heading: "Set quantity and target",
        body: "Most plans let you pick the exact quantity inside a range using a slider. Pricing recalculates live so you can decide where to stop. The target field accepts either a public username (without the @) or the full URL of the post or profile. Profiles must be public during delivery for the engagement to land; private accounts cannot receive followers or likes from our partners. If you are buying for a post, make sure the post is already published and that comments are open if the plan you chose includes comments.",
      },
      {
        heading: "Checkout and order tracking",
        body: "At checkout you pick a payment method (card, PIX in Brazil, or USDT / BTC / ETH on supported chains) and confirm the order. Once payment clears, the order page shows a status timeline: payment received, queued, in progress, delivered. You can open a support ticket directly from that page if anything looks off. We never ask for the password of your Instagram or TikTok account at any step.",
      },
      {
        heading: "Save the access link",
        body: "After checkout we send a magic link to the email you used. That link opens your full order history and lets you reorder, request a refill or contact support, all without a password. If you lose the email, the recovery form on the login page sends a new link in seconds. Treat the email as the source of truth: it is the only credential we keep for your account.",
      },
    ],
    relatedSlugs: ["choose-the-right-plan", "delivery-time", "payment-methods-overview"],
  },
  {
    slug: "delivery-time",
    title: "How long does delivery take?",
    category: "delivery",
    updatedAt: UPDATED,
    intro:
      "Delivery time depends on the plan, the volume you ordered, the social network, and how busy the routing layer is at that moment. Most engagement plans start within minutes of the payment being confirmed and complete within a few hours; large orders are intentionally spread out over a longer window so the engagement signals look organic and stay within the platform thresholds that Instagram and TikTok publish. The order page shows a live status and a rough ETA based on past runs.",
    sections: [
      {
        heading: "Typical windows by category",
        body: "Followers usually start within 5 to 30 minutes and finish inside 6 to 24 hours, depending on volume. Likes are the fastest category and often complete in under an hour. Views run in steady waves over the first day. Comments are the slowest because each comment is written by a real account, so even a small order can take a full day to land. These ranges are typical, not guaranteed: at peak times or during platform-level slowdowns the windows can stretch.",
      },
      {
        heading: "Why we drip instead of dumping",
        body: "Instagram and TikTok both watch for sudden spikes that do not match an account's baseline. Delivering 50,000 followers in a single minute is technically possible but creates a pattern that is easy to flag. Our routing splits large orders into smaller waves spaced across hours so the engagement signals look closer to normal growth. The trade-off is that fast does not mean instant; the slower curve is what keeps the plans aligned with platform expectations and helps the engagement stay attached after delivery.",
      },
      {
        heading: "What can delay an order",
        body: "Two things can hold a queue: a private target, and a payment that is still confirming on-chain. Private Instagram and TikTok accounts cannot receive engagement from our suppliers, so the system pauses delivery until the profile is set to public. Crypto payments wait for the number of confirmations required by the network — usually a few minutes for Tron USDT, longer for Bitcoin. The order page shows which step is pending.",
      },
      {
        heading: "Tracking and ETA accuracy",
        body: "The progress bar on the order page is an estimate based on the dispatch logs of similar orders. It is not a contractual ETA. If a run finishes faster than expected, the bar jumps to complete; if it lags, the bar stalls until the next wave lands. You can open a ticket from the same page at any point; we answer in English and Portuguese inside business hours and check the inbox over weekends.",
      },
    ],
    relatedSlugs: ["how-to-buy", "refill-guarantee", "account-safety-no-password"],
  },
  {
    slug: "refill-guarantee",
    title: "Refill guarantee, drop policy and what it covers",
    category: "delivery",
    updatedAt: UPDATED,
    intro:
      "Engagement on Instagram and TikTok is not static. Some of the followers, likes or views that land on your account during a campaign will drop off later, because platforms keep cleaning their networks and because some delivery sources naturally churn. The refill guarantee is the way Viralefy offsets that drop: inside a defined window we top up the order back to its original count, free of charge, as many times as needed. The window and the exact scope are written on each plan card before you buy.",
    sections: [
      {
        heading: "What counts as a drop",
        body: "A drop is any decrease in the count delivered by your plan that happens after the order is marked complete. We compare the count at delivery against the current count on the public profile or post. If the drop is inside the refill window written on the plan, we re-queue the missing volume. Comments and saves are not refilled because they cannot be replaced like-for-like once a real user has interacted; the original engagement still counts.",
      },
      {
        heading: "How to request a refill",
        body: "Open the order page from your magic link, click Request refill, and the form pre-fills with the target and the delivered count. Our routing checks the current count on the target, confirms a drop has happened, and dispatches the top-up. You can also open a regular support ticket if you prefer to talk it through. There is no fee and no limit on the number of refill requests inside the window.",
      },
      {
        heading: "What the guarantee does not cover",
        body: "The refill guarantee does not cover engagement that disappears because the target account became private, because the post was deleted, because the account was suspended by Instagram or TikTok, or because the username was changed after delivery. It also does not promise a specific growth outcome or a specific reach: it covers the count we delivered, not the algorithmic boost you may or may not get. Plans describe a publicly visible engagement boost, not a ranking guarantee.",
      },
      {
        heading: "Window length per category",
        body: "Followers plans typically include a 30-day refill window. Likes and views are usually shorter because the post engagement settles quickly. Custom enterprise plans can extend the window through a ticket; pricing reflects the longer commitment. The exact window for each plan is written in the plan card and the order receipt, so you always have a record of what is included.",
      },
    ],
    relatedSlugs: ["delivery-time", "refund-policy-explained", "choose-the-right-plan"],
  },
  {
    slug: "payment-methods-overview",
    title: "Payment methods we accept",
    category: "payments",
    updatedAt: UPDATED,
    intro:
      "Viralefy accepts a small, curated set of payment methods. The canonical settlement currency is USDT, pegged 1:1 with USD; everything else is converted at checkout. Local methods are available where they make practical sense — PIX in Brazil, cards in most countries — but the storefront defaults to USD or USDT pricing so the numbers are comparable across markets. There is no signup or KYC for normal orders; checkout is one-shot and tied to the email you provide.",
    sections: [
      {
        heading: "Cards",
        body: "Visa, Mastercard and the main local card networks are accepted in markets where the processor supports them. The charge appears on your statement as Viralefy or as the processor descriptor for that region. Card payments confirm instantly in most cases. We do not store the card data ourselves; the processor handles tokenisation and 3-D Secure. Refunds to cards go through the original processor and take the usual 5 to 10 business days to appear, depending on the issuer.",
      },
      {
        heading: "PIX (Brazil)",
        body: "Brazilian customers can pay with PIX, the instant transfer rail run by the Central Bank of Brazil. The checkout shows a QR code and a copy-paste key; payment usually confirms in seconds. PIX amounts are quoted in BRL but the underlying order is still recorded in USDT, so the conversion rate is locked at the moment you open the QR. We do not pre-charge or hold funds — the QR expires after a few minutes if unused.",
      },
      {
        heading: "Crypto: USDT, BTC, ETH",
        body: "Crypto payments are first-class. USDT on TRC-20 is the most common because the fee is tiny and confirmations are fast. BTC on the main chain and ETH on Ethereum mainnet are also supported. The checkout shows a fresh address per order; sending the exact amount to that address confirms the order once the network reaches the required confirmation count. Sending less than the invoice will leave the order unpaid until the difference lands.",
      },
      {
        heading: "Display currency vs. billing currency",
        body: "The site can display prices in many currencies as a hint, but the actual billing happens in USD or USDT for non-PIX flows. The currency hint changes the number you see on the card; it does not change which currency is charged. This separation keeps the catalogue consistent across countries and avoids float drift when the storefront is opened in two tabs with different display currencies.",
      },
    ],
    relatedSlugs: ["paying-with-crypto", "paying-with-pix-brl", "refund-policy-explained"],
  },
  {
    slug: "paying-with-crypto",
    title: "Paying with crypto (USDT, BTC, ETH)",
    category: "payments",
    updatedAt: UPDATED,
    intro:
      "Crypto checkout on Viralefy is designed to be boring on purpose: one address per order, one amount, one confirmation count. USDT on TRC-20 (Tron) is the recommended default because the fees are negligible and finality is fast, but BTC on the main chain and ETH on Ethereum mainnet are fully supported. The checkout never asks for your wallet keys; it only displays a deposit address and the exact amount to send.",
    sections: [
      {
        heading: "Pick a network carefully",
        body: "USDT exists on several networks — TRC-20 (Tron), ERC-20 (Ethereum), BEP-20 (BSC), and others. Sending USDT to an address from a different network than the one shown at checkout will lose the funds permanently because the address format collides between chains. The checkout page labels the network clearly above the address; always double-check on your wallet that the network selector matches before signing the transaction. If you are unsure, USDT on TRC-20 is the safe default.",
      },
      {
        heading: "Confirmations and timing",
        body: "Each network needs a number of block confirmations before we mark the payment as final. USDT on TRC-20 typically confirms in under a minute. BTC needs three confirmations on mainnet, which can take 20 to 40 minutes depending on fee market conditions. ETH usually finalises within a few minutes. The order page polls the chain and updates the status the moment the threshold is reached; there is no manual step on your side.",
      },
      {
        heading: "Underpayments and overpayments",
        body: "If the amount received does not match the invoice exactly, the order stays in a pending state and the dashboard shows the delta. For underpayments, sending the remaining balance to the same address closes the gap and the order proceeds. For overpayments, support can either credit the excess to a follow-up order or refund the difference to a wallet you provide. Network fees you pay to the chain are not part of the invoice — the invoice is the amount that must arrive in our wallet.",
      },
      {
        heading: "Privacy and on-chain footprint",
        body: "We do not link wallet addresses to your customer profile beyond what is needed to clear the order. Each order uses a fresh deposit address so the on-chain pattern is hard to correlate. We do not require any identity document for normal-size orders; for enterprise orders that exceed our internal threshold we may ask for a compliance form, but that is the exception, not the default.",
      },
    ],
    relatedSlugs: ["payment-methods-overview", "paying-with-pix-brl", "account-safety-no-password"],
  },
  {
    slug: "paying-with-pix-brl",
    title: "Paying with PIX in Brazilian Reais",
    category: "payments",
    updatedAt: UPDATED,
    intro:
      "PIX is the instant transfer system run by the Central Bank of Brazil and the most common way Brazilian customers pay on Viralefy. The checkout produces a QR code and a copy-paste string (Pix copia e cola) tied to a unique invoice; once your bank app confirms the transfer, the order moves into the queue automatically. Payments are quoted in BRL but the underlying order is recorded in USDT at the rate captured when the QR was created.",
    sections: [
      {
        heading: "How the QR code works",
        body: "When you reach the PIX step, the system generates a fresh QR code that encodes the receiving key, the exact amount in BRL, and an invoice identifier. Scanning the QR inside your bank app pre-fills all fields so you cannot accidentally send the wrong amount or to the wrong key. If you prefer, copy the long Pix copia e cola string and paste it into your bank app — the result is the same. The QR is one-shot: once paid, it cannot be reused.",
      },
      {
        heading: "Confirmation time",
        body: "PIX is designed for instant settlement and most payments confirm in under 30 seconds. Some banks queue transfers in batches at off-peak hours, in which case the confirmation can take a few minutes; that is a quirk of the issuing bank, not our system. Once the bank reports the transfer to the PIX network, our payment processor pushes a webhook and the order page updates automatically. There is no need to send a screenshot of the receipt — we do not accept manual proofs.",
      },
      {
        heading: "Expiry and retry",
        body: "Each QR code expires a few minutes after it is generated so the BRL/USDT rate does not drift. If you let it expire, refresh the checkout page and a new QR appears with the current rate. If you paid an expired QR by accident, support can either credit the order at the locked rate or refund the BRL through PIX to the originating account; either way, no funds are lost.",
      },
      {
        heading: "What appears on your statement",
        body: "The PIX transfer shows up in your bank statement with the merchant name configured by our processor, plus the invoice identifier in the reference field. Keep the receipt: it is the cleanest record for accounting and for opening a ticket if the order does not progress. We do not charge a service fee on PIX; the amount you send is the amount we receive.",
      },
    ],
    relatedSlugs: ["payment-methods-overview", "paying-with-crypto", "refund-policy-explained"],
  },
  {
    slug: "account-safety-no-password",
    title: "Why we do not ask for your Instagram or TikTok password",
    category: "safety",
    updatedAt: UPDATED,
    intro:
      "Viralefy never asks for the password of your Instagram or TikTok account. We do not need it, and giving it to any third party would expose you to risk that is not worth taking. Everything we deliver — followers, likes, views, comments — happens against the public profile or post URL you provide. The only thing that has to be true is that the target is public during the delivery window so our partners can reach it.",
    sections: [
      {
        heading: "How delivery works without credentials",
        body: "Engagement delivery is essentially a routing layer: your order describes a target (a public username or URL) and a quantity, and partner networks dispatch the engagement against that public surface. None of that flow needs to authenticate as you. Anyone who asks for your password is either confused or attempting a takeover; the correct reaction is to refuse and to change the password immediately if you already shared it.",
      },
      {
        heading: "Protecting your account on Instagram and TikTok",
        body: "Even though we do not need your password, you should still protect it. Enable two-factor authentication in the Instagram or TikTok app, prefer an authenticator app over SMS, and verify that the email tied to your social account is one you fully control. If you reuse the same password elsewhere, change it; credential stuffing against social accounts is a constant background threat that has nothing to do with Viralefy.",
      },
      {
        heading: "What we do store",
        body: "We store the email you used at checkout, the orders you placed, the public target you provided, and the payment trail required for tax and refund handling. We do not store passwords for your social accounts because we never ask for them. The magic-link system on the login page is the only authentication we use for your customer dashboard; it sends a one-time link to the email on file and that link expires after use.",
      },
      {
        heading: "Phishing patterns to watch for",
        body: "If you receive a message pretending to be Viralefy and asking you to log in to your Instagram or TikTok account, it is phishing. We do not send such messages. Real emails from us only contain the magic link to your customer dashboard, order receipts, or replies to tickets you opened. When in doubt, navigate to the site by typing the address yourself and open the order from the dashboard instead of clicking through an email.",
      },
    ],
    relatedSlugs: ["how-to-buy", "delivery-time", "refund-policy-explained"],
  },
  {
    slug: "refund-policy-explained",
    title: "Refund policy explained",
    category: "account",
    updatedAt: UPDATED,
    intro:
      "Refunds on Viralefy follow a simple rule: if we did not deliver what the plan promised, we refund. The plan card is the contract — the quantity, the category, the refill window — and we measure delivery against that. The full legal text lives on the Refund Policy page; this article translates it into plain language so you know what to expect before you ask.",
    sections: [
      {
        heading: "When we refund in full",
        body: "We refund 100 percent of the order amount when the order cannot start at all, for example because the target stayed private and we could not deliver, because the payment landed twice by mistake, or because we mispriced a plan and chose to honour the lower number. Full refunds go back through the original payment method: card refunds to the same card, PIX refunds to the same PIX key, crypto refunds to a wallet address you provide. We do not refund to a different rail than the one you paid with.",
      },
      {
        heading: "When we refund partially",
        body: "If part of the order delivered and part did not, the refund is proportional to the gap. If you ordered 10,000 followers and 7,000 landed within the delivery window, we refund the equivalent of 3,000 followers and close the order. Partial refunds use the same payment rail as the original charge. If a refill is still possible we usually offer that first because it gets you the full quantity you paid for; the refund option is always on the table if you prefer.",
      },
      {
        heading: "When we do not refund",
        body: "We do not refund when the order delivered as described and the user is asking for an outcome we never promised — for example, a specific ranking, a specific number of impressions, or sustained organic growth. We also do not refund engagement that disappeared because the target account became private after delivery, was deleted, was suspended by Instagram or TikTok, or had its username changed. Refunds also do not cover crypto fees you paid to the network when sending the original transaction.",
      },
      {
        heading: "How to request a refund",
        body: "Open the order page from the magic link in your email and use the Request refund button. The form lets you describe what happened and attach screenshots; the ticket lands directly with the team. Most refund decisions come back within one business day. You can also email support if you cannot find the magic link, and we will help you locate the order from the email address you used at checkout.",
      },
    ],
    relatedSlugs: ["refill-guarantee", "delivery-time", "payment-methods-overview"],
  },
  {
    slug: "instagram-followers-buying-guide",
    title: "Instagram followers: buying guide",
    category: "buying",
    updatedAt: UPDATED,
    intro:
      "Buying Instagram followers is the most common purchase on Viralefy and the most misunderstood. A follower plan is a publicly visible engagement boost: extra accounts follow your profile inside the delivery window described on the plan card. It does not unlock the Instagram algorithm, it does not guarantee organic growth, and it does not bypass Meta's community guidelines. Reading this guide before you buy helps you set realistic expectations and pick the tier that fits your goal.",
    sections: [
      {
        heading: "What a follower plan actually delivers",
        body: "Each plan describes a quantity, a delivery window, and a refill window. We deliver the followers against the public username you provide, spread across the window so the increase looks closer to organic growth. We never claim the followers will engage with your future posts at any specific rate; engagement quality depends on too many factors outside our control. Treat the plan as social proof on the profile page, not as an audience for monetisation.",
      },
      {
        heading: "Setting a realistic quantity",
        body: "For a small creator account, jumping from 200 followers to 50,000 in a single week creates a footprint that looks abrupt to anyone reading the profile. A more measured uplift — for example, doubling the count over a couple of weeks — fits better with the rest of the activity on the page and is easier to sustain with organic posting. Larger orders make more sense for accounts that already have a sizeable baseline and a regular posting cadence.",
      },
      {
        heading: "Public profile and post quality",
        body: "The profile must be public during the entire delivery window; private accounts cannot receive followers from our partner networks. A complete bio, a profile picture, and at least a handful of recent posts make the account look credible to anyone who clicks through. If the profile is empty, the new follower count will read as inflated and the social-proof benefit you wanted from the campaign will not land.",
      },
      {
        heading: "What to expect after delivery",
        body: "Some natural drop after delivery is normal because Instagram continuously prunes its network and because some delivery sources churn. The refill window on the plan covers that drop. You should not expect your reach, impressions, or stories views to change because of the follower campaign alone; reach is driven mostly by content, posting cadence, and the algorithm, none of which a follower plan touches directly. Combine the campaign with consistent organic content for the best effect.",
      },
    ],
    relatedSlugs: ["tiktok-followers-buying-guide", "choose-the-right-plan", "refill-guarantee"],
  },
  {
    slug: "tiktok-followers-buying-guide",
    title: "TikTok followers: buying guide",
    category: "buying",
    updatedAt: UPDATED,
    intro:
      "TikTok plans share most of the mechanics of Instagram plans but the platform behaviour is different enough to deserve its own guide. Delivery curves are typically faster because TikTok engagement settles quickly, and the For You feed reacts to early signals on a video more than to profile-level metrics. This guide explains what a TikTok follower plan does, what it does not do, and how to combine it with your posting strategy.",
    sections: [
      {
        heading: "TikTok versus Instagram, in one paragraph",
        body: "On Instagram, follower count is a profile-level credibility signal that affects how new visitors perceive the account. On TikTok, follower count matters less because the For You feed routes videos to viewers who have never seen the account before. A TikTok follower plan still adds social proof on the profile page, but it does not change how the algorithm picks up a video. The fastest path to more reach on TikTok remains posting consistently and watching which hooks land.",
      },
      {
        heading: "What we deliver",
        body: "A TikTok follower plan adds accounts that follow your username inside the delivery window described on the plan card. We dispatch the follows across the window rather than in a single burst. We do not promise a position on the For You feed, a specific number of video views, or any growth outcome beyond the follower count itself. The plan is a publicly visible engagement boost, nothing more and nothing less.",
      },
      {
        heading: "Public profile and content readiness",
        body: "The TikTok profile must be public during delivery — private accounts cannot receive followers from our partner networks. Before launching a large follower campaign, post at least a few videos so the new follower count does not feel detached from the rest of the account. If the profile has zero content, anyone who lands on it will read the follower count as inflated and the social-proof effect you wanted from the campaign will not land.",
      },
      {
        heading: "Combining followers with views or likes",
        body: "Some buyers run a small views or likes plan on a recent video alongside the follower plan. That combination puts the early engagement on a piece of content rather than only on the profile counter, which reads more naturally to a viewer who clicks through. As always, the engagement is a public boost and not a guarantee of For You placement; the algorithm has its own signals that we do not control.",
      },
    ],
    relatedSlugs: ["instagram-followers-buying-guide", "choose-the-right-plan", "refill-guarantee"],
  },
  {
    slug: "what-is-a-business-manager",
    title: "What is a Facebook Business Manager (BM)?",
    category: "buying",
    updatedAt: UPDATED,
    intro:
      "A Facebook Business Manager — usually shortened to BM — is the central control panel that Meta provides for running ads, owning Pages, owning Pixels, and managing the people who have access to those assets. For media buyers who run Meta ads at scale, the BM is the unit of organisation: each BM has its own daily spend cap, its own ad accounts, and its own reputation against Meta's enforcement systems. The Viralefy marketplace lists pre-built BMs ready to use; this article explains what that means.",
    sections: [
      {
        heading: "Why media buyers buy BMs instead of creating one",
        body: "Anyone can create a Business Manager from scratch in a few minutes. The difference between a freshly created BM and a pre-built one is reputation: aged BMs that have already passed Meta's verification, that have a clean payment history, and that have run small amounts of spend tend to receive higher daily caps and less aggressive review than a brand-new one. Media buyers who need to ramp ad spend quickly often start from a pre-built BM to skip the friction of the first weeks.",
      },
      {
        heading: "What a BM listing on Viralefy includes",
        body: "Each BM listed on Viralefy describes the daily spend cap tier, whether the BM is already verified, how many ad accounts it ships with, and how long it has existed. Some listings also include a Page already attached, others ship with a clean BM where you create the Page yourself. The handover happens after payment confirms: credentials, recovery email, and any backup access are delivered through the support ticket that opens automatically with the order.",
      },
      {
        heading: "What to do on first login",
        body: "Change the password immediately, set your own two-factor authentication, and verify the recovery email so the BM is fully under your control. Do not load aggressive creatives in the first 24 hours; ramp gradually so the spend curve looks consistent with the BM's history. If the BM trips a review on the very first login, the replacement window described on the plan card covers a free swap.",
      },
      {
        heading: "Limits of what we promise",
        body: "We sell access to a BM with a described daily cap; we do not promise that Meta will leave the BM untouched forever. Ad accounts can be flagged, restricted or banned at any time based on creative content, landing pages, or category. The plan covers a replacement at first login if the BM is dead on arrival; ongoing operational risk after that point is the buyer's responsibility, the same as for any BM created from scratch.",
      },
    ],
    relatedSlugs: ["how-to-buy", "choose-the-right-plan", "refund-policy-explained"],
  },
  {
    slug: "choose-the-right-plan",
    title: "How to choose the right plan",
    category: "buying",
    updatedAt: UPDATED,
    intro:
      "Most buyers spend more time than they need picking between two adjacent plans. The honest answer is that the difference between, for example, 5,000 and 10,000 followers is rarely the deciding factor for the outcome you want. What matters more is matching the category to the goal — followers for profile credibility, likes or views for content traction, comments for thread depth — and picking a quantity that fits your baseline. This guide walks through the decision.",
    sections: [
      {
        heading: "Start from the goal, not the category",
        body: "Ask what changes once the campaign ends. If the answer is profile-level credibility, pick a follower plan. If the answer is making a recent post look popular, pick a likes or views plan on that specific post. If the answer is making a thread look active, pick a comments plan and accept the slower delivery. Buying the wrong category is the single most common mistake; the second most common is buying a quantity that breaks the visual baseline of the account.",
      },
      {
        heading: "Pick a quantity that matches the baseline",
        body: "A profile that has 800 followers and starts showing 50,000 within a week reads as inflated to anyone who lands on it. A profile that goes from 800 to 1,500 over the same week reads as normal early growth. The plan slider lets you pick the exact quantity inside the supported range; use that to land on a number that fits where the account already is, then run a second campaign later if you want more.",
      },
      {
        heading: "Read the refill window before you buy",
        body: "The refill window is the safety net on the campaign. Plans with longer windows tend to cost more because the operational commitment is higher. If you are running the campaign on a single asset that you care about, the longer window is usually worth the price difference. If the campaign is exploratory and you can re-buy if the count drops, the shorter window is fine.",
      },
      {
        heading: "When in doubt, start small",
        body: "Buying a small plan first is the cheapest way to validate how the delivery and refill work for your specific account, before committing to a larger order. The marketplace is designed so a small first order is a low-friction action: no signup, one-shot checkout, magic-link follow-up. Use that to feel the system out, then scale the second order to the size that actually matches the goal.",
      },
    ],
    relatedSlugs: ["how-to-buy", "instagram-followers-buying-guide", "tiktok-followers-buying-guide"],
  },
];

export function helpTopicBySlug(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((t) => t.slug === slug);
}

export function helpTopicsByCategory(category: HelpCategory): HelpTopic[] {
  return HELP_TOPICS.filter((t) => t.category === category);
}

export function helpAllSlugs(): string[] {
  return HELP_TOPICS.map((t) => t.slug);
}
