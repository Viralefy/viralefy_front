// Composite case studies — personas anônimas + métricas direcionais.
// Não usa identidades reais; quote/attribution são compostos.

export type CaseStudy = {
  slug: string;
  title: string;
  industry: string;
  clientPersona: string;
  challenge: string;
  approach: string;
  resultMetric: string;
  resultBody: string;
  quote: string;
  quoteAttribution: string;
  publishedAt: string;
  updatedAt: string;
};

export const CASE_STUDY_DISCLAIMER =
  "Composite testimonial. Real client identities protected; metrics directional based on aggregated panel data.";

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "small-business-instagram-growth",
    title: "Local boutique grew Instagram reach 8x in 90 days",
    industry: "Small business",
    clientPersona: "Owner-operated apparel boutique, single-city footprint, 1.2k followers at start.",
    challenge:
      "The boutique had stagnant organic reach and no budget for traditional ads. Posts averaged 40 likes and engagement had been flat for six months. The owner wanted measurable lift without diluting the brand voice.",
    approach:
      "We seeded a layered campaign across niche-matched Instagram followers, story views and saves on three pillar posts per week. Each batch was paced over 48 hours to mirror organic discovery curves and avoid burst-pattern flags.",
    resultMetric: "8.4x reach lift",
    resultBody:
      "Average post reach moved from ~600 impressions to roughly 5,000 over 90 days. Saves per post tripled and the account started appearing in the Explore feed for two regional hashtags it had never ranked for.",
    quote:
      "We stopped feeling invisible in the feed. The compounding effect after week four was the part we did not expect.",
    quoteAttribution: "Owner, regional apparel boutique",
    publishedAt: "2026-02-14T10:00:00Z",
    updatedAt: "2026-02-14T10:00:00Z",
  },
  {
    slug: "ecommerce-tiktok-launch",
    title: "DTC skincare brand validated a TikTok launch in 21 days",
    industry: "E-commerce",
    clientPersona: "Bootstrapped direct-to-consumer skincare brand with three SKUs and no TikTok presence.",
    challenge:
      "The founders needed to know whether TikTok was a viable channel before committing to a full content team. Cold posts were getting under 200 views and they had no signal on which hook was working.",
    approach:
      "We layered TikTok views, likes and follows across six test creatives over three weeks. Each creative ran with a baseline boost so the algorithm had enough signal to push to lookalike audiences. The brand used the resulting view-through data to pick a single winning hook.",
    resultMetric: "1 winning creative",
    resultBody:
      "Of six tested hooks, one cleared a 14% completion rate and was promoted to organic-only distribution. That single creative compounded to roughly 380k views in the following month with no additional engagement spend.",
    quote:
      "Three weeks of structured testing replaced what would have been six months of guessing. We knew which creative to scale before we hired the editor.",
    quoteAttribution: "Co-founder, DTC skincare brand",
    publishedAt: "2026-02-28T10:00:00Z",
    updatedAt: "2026-02-28T10:00:00Z",
  },
  {
    slug: "agency-client-delivery-pipeline",
    title: "Boutique agency standardized engagement delivery for 14 clients",
    industry: "Marketing agency",
    clientPersona: "Five-person social agency managing 14 active retainers across fashion, F&B and wellness.",
    challenge:
      "The agency was juggling four different engagement vendors with inconsistent delivery windows, no shared dashboard and recurring billing reconciliation pain. Account managers spent ~5 hours per week chasing status.",
    approach:
      "We consolidated all 14 retainers under a single account with category-based plans and a unified ticket queue. Recurring weekly orders were scheduled via the dashboard so account managers only intervened on exceptions.",
    resultMetric: "5h saved per AM, weekly",
    resultBody:
      "Account managers reclaimed roughly five hours per week each, which translated to two extra discovery calls per AM per month. Client churn over the following quarter dropped from a baseline of two cancellations to zero.",
    quote:
      "The pipeline went from spreadsheet plus four logins to one tab. Our AMs stopped being couriers.",
    quoteAttribution: "Head of operations, boutique social agency",
    publishedAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-03-12T10:00:00Z",
  },
  {
    slug: "influencer-debut-acceleration",
    title: "First-time creator hit 10k followers in six weeks",
    industry: "Creator economy",
    clientPersona: "First-time lifestyle creator launching from zero with no existing audience and no other social presence.",
    challenge:
      "The creator had high-quality content but the cold-start problem was severe. Posts were sitting at single-digit reach for three weeks and brand-deal outreach was being declined on follower-count grounds.",
    approach:
      "We staged a structured ramp: niche-targeted followers in week one, story views and saves layered against organic posts in weeks two through four, then post likes spread across the back catalog to lift social proof on profile visits.",
    resultMetric: "10,400 followers in 6 weeks",
    resultBody:
      "The account crossed 10k followers in week six, which unlocked the Instagram swipe-up equivalent and changed the response rate on brand outreach from under 5% to roughly 30%. Engagement rate held above 4% across the ramp.",
    quote:
      "The threshold to be taken seriously by brands is brutal. Crossing 10k changed every conversation I had.",
    quoteAttribution: "First-time lifestyle creator",
    publishedAt: "2026-03-25T10:00:00Z",
    updatedAt: "2026-03-25T10:00:00Z",
  },
  {
    slug: "restaurant-local-engagement",
    title: "Neighbourhood restaurant doubled weekday foot traffic",
    industry: "Hospitality",
    clientPersona: "Single-location neighbourhood restaurant with a 2.4k-follower Instagram and weak weekday covers.",
    challenge:
      "Weekends were full but Tuesday through Thursday were sub-30% occupancy. The owner suspected nobody in the local catchment knew about midweek menus, but had no way to reach beyond the existing follower base.",
    approach:
      "We targeted geo-matched followers and post engagement on a weekly midweek-special post. Story views were layered on day-of posts to surface the restaurant in the local Stories ribbon. The team paired this with a QR-coded landing for attribution.",
    resultMetric: "+97% weekday covers",
    resultBody:
      "Tuesday through Thursday covers nearly doubled over eight weeks, settling at roughly 60% occupancy. QR-coded landing scans confirmed about 40% of the new midweek diners came via the Instagram funnel.",
    quote:
      "The weekend was never the problem. Filling Tuesday was. Now Tuesday pays the rent.",
    quoteAttribution: "Owner, neighbourhood restaurant",
    publishedAt: "2026-04-09T10:00:00Z",
    updatedAt: "2026-04-09T10:00:00Z",
  },
  {
    slug: "b2b-saas-thought-leadership",
    title: "B2B SaaS founder built thought-leadership signal in one quarter",
    industry: "B2B SaaS",
    clientPersona: "Solo-founder B2B SaaS in the dev-tools space, technical audience, Series A pending.",
    challenge:
      "The founder needed to show investors and enterprise prospects a credible social presence before the funding round closed. Posts averaged 80 impressions and zero comments. There was no time to grow organically before the deck went out.",
    approach:
      "We layered LinkedIn-adjacent Instagram engagement on a tight cadence of technical posts: likes, saves and selective follows from accounts matching the target ICP. The founder paired this with reposts from two well-placed angel investors.",
    resultMetric: "12x avg impressions per post",
    resultBody:
      "Average impressions moved from ~80 to ~960 per post over 12 weeks. More importantly, inbound from qualified prospects went from one DM per month to four, and two of them converted to pilot conversations during the round.",
    quote:
      "Investors do check your social. Building enough signal to look credible in 12 weeks was the unblock.",
    quoteAttribution: "Solo founder, B2B dev-tools SaaS",
    publishedAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-05-02T10:00:00Z",
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
