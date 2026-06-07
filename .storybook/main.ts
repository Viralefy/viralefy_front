// Storybook config mínimo (Fase 8.2).
//
// Framework: @storybook/nextjs-vite — roda o Next App Router em Vite, o que
// dá HMR instantâneo das stories sem precisar do build server do Next. As
// `addons` ficam fora deliberadamente; ativamos só o essencial e crescemos
// sob demanda.
//
// O `stories` aponta pra qualquer `*.stories.tsx` dentro de `src/components`.
// Se outros sub-paths quiserem stories (lib/ ou app/), o glob precisa ser
// expandido — pra Fase 8.2 cobrimos só o catálogo de componentes.

type StorybookConfig = {
  stories: string[];
  framework: string | { name: string; options?: Record<string, unknown> };
  addons?: string[];
  docs?: Record<string, unknown>;
  typescript?: Record<string, unknown>;
};

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  stories: ["../src/components/**/*.stories.tsx"],
  addons: [],
  docs: {
    autodocs: false,
  },
  typescript: {
    // Mantemos checagem de tipos rápida — o tsc do projeto já cobre isso.
    check: false,
  },
};

export default config;
