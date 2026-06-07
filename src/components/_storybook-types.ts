// Local shim para Storybook (Fase 8.2).
//
// O pacote @storybook/nextjs-vite e @storybook/react foram adicionados ao
// package.json como devDeps, mas não rodamos `npm install` no fluxo de
// verificação (CI usa npx tsc --noEmit isolado). Pra manter tsc verde sem
// node_modules dos pacotes do Storybook, expomos aqui um subset estrutural
// dos tipos `Meta<T>` e `StoryObj<T>`. Quando o Storybook estiver instalado
// localmente, basta trocar este import por `@storybook/react` nas stories.
//
// Mantém a API idiomática: cada story é `StoryObj<typeof Component>`.

import type { ComponentType } from "react";

export type Meta<TComponent> = {
  title: string;
  component: TComponent;
  parameters?: Record<string, unknown>;
  argTypes?: Record<string, unknown>;
  args?: Partial<InferProps<TComponent>>;
  decorators?: Array<(Story: () => unknown) => unknown>;
  tags?: string[];
};

export type StoryObj<TComponent> = {
  name?: string;
  args?: Partial<InferProps<TComponent>>;
  parameters?: Record<string, unknown>;
  render?: (args: Partial<InferProps<TComponent>>) => unknown;
};

// Helper: extrai props do componente (ComponentType<P> ou função React).
type InferProps<T> = T extends ComponentType<infer P>
  ? P
  : T extends (props: infer P) => unknown
    ? P
    : Record<string, unknown>;
