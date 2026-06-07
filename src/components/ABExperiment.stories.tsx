// Stories: ABExperiment (Fase 8.2).
//
// Em Storybook, `abAssign()` provavelmente falha (sem API) e o componente
// fica no `fallback`. Cobrimos variantes diferentes pra mostrar o shape do
// objeto `variants` que o consumidor passa.

import ABExperiment from "./ABExperiment";
import type { Meta, StoryObj } from "./_storybook-types";

function HeroControl() {
  return (
    <div style={{ padding: "2rem", border: "1px solid #00fed6", borderRadius: "0.5rem" }}>
      <h2>Buy followers</h2>
      <p style={{ color: "#9ca3af" }}>Control variant — short copy, single CTA.</p>
    </div>
  );
}

function HeroVariantA() {
  return (
    <div style={{ padding: "2rem", border: "1px solid #f0abfc", borderRadius: "0.5rem" }}>
      <h2>Grow on Instagram fast</h2>
      <p style={{ color: "#9ca3af" }}>Variant A — outcome-led copy, social proof line.</p>
    </div>
  );
}

function HeroVariantB() {
  return (
    <div style={{ padding: "2rem", border: "1px solid #facc15", borderRadius: "0.5rem" }}>
      <h2>Real followers, delivered today</h2>
      <p style={{ color: "#9ca3af" }}>Variant B — urgency framing.</p>
    </div>
  );
}

const meta: Meta<typeof ABExperiment> = {
  title: "Components/ABExperiment",
  component: ABExperiment,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof ABExperiment>;

export const HeroControlVsVariantA: Story = {
  args: {
    experimentKey: "homepage_hero_v1",
    variants: {
      control: <HeroControl />,
      variant_a: <HeroVariantA />,
    },
    fallback: <HeroControl />,
  },
};

export const HeroThreeWay: Story = {
  args: {
    experimentKey: "homepage_hero_v2",
    variants: {
      control: <HeroControl />,
      variant_a: <HeroVariantA />,
      variant_b: <HeroVariantB />,
    },
    fallback: <HeroControl />,
  },
};
