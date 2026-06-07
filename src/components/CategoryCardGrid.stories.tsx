// Stories: CategoryCardGrid (Fase 8.2).
//
// Depende de `useApp()` (currency) — em Storybook, deve ser embrulhado pelo
// `<Providers>` do app via decorador global ou inline. Aqui passamos planos
// mock e cabe ao runtime do Storybook fornecer Provider (preview.ts pode
// adicionar um decorator global se quiser).

import type { Plan } from "@/lib/api";
import { CategoryCardGrid } from "./CategoryCardGrid";
import type { Meta, StoryObj } from "./_storybook-types";

const meta: Meta<typeof CategoryCardGrid> = {
  title: "Components/CategoryCardGrid",
  component: CategoryCardGrid,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof CategoryCardGrid>;

function makePlan(id: string, name: string, qty: number, priceUsd: string): Plan {
  return {
    id,
    name,
    description: `${qty.toLocaleString()} delivered in 24h`,
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

const STARTER: Plan[] = [
  makePlan("p1", "Starter", 500, "4.90"),
  makePlan("p2", "Boost", 1000, "8.90"),
  makePlan("p3", "Pro", 5000, "29.90"),
];

const FULL: Plan[] = [
  ...STARTER,
  makePlan("p4", "Scale", 10000, "49.90"),
  makePlan("p5", "Viral", 25000, "99.90"),
];

export const ThreePlans: Story = {
  args: {
    plans: STARTER,
    lang: "en",
    countryCode: "us",
    category: "seguidores_instagram",
    unitLabel: "followers",
  },
};

export const FivePlans: Story = {
  args: {
    plans: FULL,
    lang: "en",
    countryCode: "us",
    category: "seguidores_instagram",
    unitLabel: "followers",
  },
};

export const Portuguese: Story = {
  args: {
    plans: STARTER,
    lang: "pt",
    countryCode: "br",
    category: "seguidores_instagram",
    unitLabel: "seguidores",
  },
};

export const HiddenDetailLink: Story = {
  args: {
    plans: STARTER,
    lang: "en",
    countryCode: "us",
    category: "seguidores_instagram",
    unitLabel: "followers",
    hideDetailLink: true,
  },
};
