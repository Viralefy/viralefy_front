// Stories: QuantitySlider (Fase 8.2).
//
// Calculadora reutilizável. Recebe planos JÁ filtrados por categoria. Como
// depende de `useApp()` pra currency, precisa de `<Providers>` no Storybook
// (decorador). Em tsc-only só conferimos tipagem das args.

import type { Plan } from "@/lib/api";
import { QuantitySlider } from "./QuantitySlider";
import type { Meta, StoryObj } from "./_storybook-types";

function plan(id: string, qty: number, priceUsd: string): Plan {
  return {
    id,
    name: `${qty.toLocaleString()} followers`,
    description: `Drip-fed delivery, no password required`,
    category: "seguidores_instagram",
    platform: "instagram",
    target_type: "profile",
    followers_qty: qty,
    price_cents: Math.round(parseFloat(priceUsd) * 100),
    currency: "USD",
    active: true,
    sort_order: 1,
    prices: { USD: priceUsd, USDT: priceUsd },
  };
}

const FOLLOWERS: Plan[] = [
  plan("f1", 500, "4.90"),
  plan("f2", 1000, "8.90"),
  plan("f3", 2500, "19.90"),
  plan("f4", 5000, "29.90"),
  plan("f5", 10000, "49.90"),
];

const LIKES: Plan[] = [
  plan("l1", 100, "1.90"),
  plan("l2", 500, "4.90"),
  plan("l3", 1000, "8.90"),
];

const meta: Meta<typeof QuantitySlider> = {
  title: "Components/QuantitySlider",
  component: QuantitySlider,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof QuantitySlider>;

export const FollowersEnglish: Story = {
  args: { plans: FOLLOWERS, lang: "en", unitLabel: "followers" },
};

export const FollowersPortuguese: Story = {
  args: { plans: FOLLOWERS, lang: "pt", unitLabel: "seguidores" },
};

export const LikesEnglish: Story = {
  args: { plans: LIKES, lang: "en", unitLabel: "likes" },
};
