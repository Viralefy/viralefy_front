// Storybook preview (Fase 8.2).
//
// Parameters básicos + viewport defaults. Decoradores ficam por story porque
// muitos componentes precisam do `Providers` (currency/user/PPP); embrulhar
// global aqui forçaria todas as stories a baterem fetch em /api/geo etc.
//
// Em vez disso, cada story que precisa de contexto monta seu próprio
// wrapper inline com props mock — sem chamadas de rede, sem flash.

type Preview = {
  parameters: Record<string, unknown>;
  decorators?: Array<(Story: () => unknown) => unknown>;
  tags?: string[];
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0a0a0f" },
        { name: "light", value: "#ffffff" },
      ],
    },
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default preview;
