// Stories: LiveCounter (Fase 8.2).
//
// Client component que polla `/api/orders-today`. Em Storybook a chamada
// falha silenciosamente — o componente fica em `null` até a primeira
// resposta. Pra visualizar, use `parameters.msw` (não habilitado nesta
// fase) ou stub no decorator.

import { LiveCounter } from "./LiveCounter";
import type { Meta, StoryObj } from "./_storybook-types";

const meta: Meta<typeof LiveCounter> = {
  title: "Components/LiveCounter",
  component: LiveCounter,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof LiveCounter>;

export const English: Story = {
  args: { lang: "en" },
};

export const Portuguese: Story = {
  args: { lang: "pt" },
};

export const Spanish: Story = {
  args: { lang: "es" },
};
