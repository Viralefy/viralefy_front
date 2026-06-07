// Stories: TrustSignals (Fase 8.2).
//
// Componente puro server-side, sem providers necessários. Variantes cobrem
// os dois modos (default vs compact) e mudança de idioma — o texto vem de
// `tr(lang)` então a story em PT serve de smoke-check de i18n.

import { TrustSignals } from "./TrustSignals";
import type { Meta, StoryObj } from "./_storybook-types";

const meta: Meta<typeof TrustSignals> = {
  title: "Components/TrustSignals",
  component: TrustSignals,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof TrustSignals>;

export const Default: Story = {
  args: { lang: "en", variant: "default" },
};

export const Compact: Story = {
  args: { lang: "en", variant: "compact" },
};

export const Portuguese: Story = {
  args: { lang: "pt", variant: "default" },
};

export const CompactPortuguese: Story = {
  args: { lang: "pt", variant: "compact" },
};
