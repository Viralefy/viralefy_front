// Stories: CheckoutModal (Fase 8.2).
//
// Modal client que abre sobre o app. Depende de `useApp()` e bate em
// `/v1/checkout`, `/v1/profiles`, `/v1/credit-accounts`. No Storybook
// nenhuma dessas calls completa — o modal renderiza o formulário inicial.
// Cobrimos plano de profile (followers) e plano de publicação (likes em
// post).

import type { Plan } from "@/lib/api";
import { CheckoutModal } from "./CheckoutModal";
import type { Meta, StoryObj } from "./_storybook-types";

const meta: Meta<typeof CheckoutModal> = {
  title: "Components/CheckoutModal",
  component: CheckoutModal,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof CheckoutModal>;

const PROFILE_PLAN: Plan = {
  id: "plan_profile_1",
  name: "1,000 IG followers",
  description: "Drip-fed delivery in 24h",
  category: "seguidores_instagram",
  platform: "instagram",
  target_type: "profile",
  followers_qty: 1000,
  price_cents: 890,
  currency: "USD",
  active: true,
  sort_order: 1,
  prices: { USD: "8.90", USDT: "8.90" },
};

const PUBLICATION_PLAN: Plan = {
  id: "plan_publication_1",
  name: "500 IG likes",
  description: "Instant delivery on a single post",
  category: "curtidas_instagram",
  platform: "instagram",
  target_type: "publication",
  followers_qty: 500,
  price_cents: 290,
  currency: "USD",
  active: true,
  sort_order: 1,
  prices: { USD: "2.90", USDT: "2.90" },
};

const noop = () => undefined;

export const ProfilePlanEnglish: Story = {
  args: { plan: PROFILE_PLAN, lang: "en", onClose: noop },
};

export const PublicationPlanEnglish: Story = {
  args: { plan: PUBLICATION_PLAN, lang: "en", onClose: noop },
};

export const ProfilePlanPortuguese: Story = {
  args: { plan: PROFILE_PLAN, lang: "pt", onClose: noop },
};
