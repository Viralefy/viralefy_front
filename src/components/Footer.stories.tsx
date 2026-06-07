// Stories: Footer (Fase 8.2).
//
// Footer.tsx é arquivo compartilhado (não pode ser modificado nesta fase),
// mas podemos importar e renderizar livremente. Cobrimos os dois modos
// (default + compact) e 3 idiomas pra checar o output dos slugs legais
// traduzidos.

import { Footer } from "./Footer";
import type { Meta, StoryObj } from "./_storybook-types";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const English: Story = {
  args: { lang: "en", compact: false },
};

export const EnglishCompact: Story = {
  args: { lang: "en", compact: true },
};

export const Portuguese: Story = {
  args: { lang: "pt", compact: false },
};

export const Spanish: Story = {
  args: { lang: "es", compact: false },
};
