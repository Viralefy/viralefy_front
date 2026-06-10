// Stories: CookieBanner (Fase 8.2).
//
// O banner decide visibilidade lendo `localStorage["viralefy_gdpr_consent"]`
// no mount. Em Storybook, dependendo do estado do localStorage, ele aparece
// como banner ou some. Para forçar visualização, usamos um wrapper que
// limpa (ou prima) o storage antes do mount.

import { useEffect, type ReactNode } from "react";
import { CookieBanner } from "./CookieBanner";
import type { Meta, StoryObj } from "./_storybook-types";

const STORAGE_KEY = "viralefy_gdpr_consent";

function WithStorage({ prime, children }: { prime: "clear" | "consented"; children: ReactNode }) {
  useEffect(() => {
    try {
      if (prime === "clear") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: 2,
            necessary: true,
            preferences: true,
            analytics: true,
            marketing: false,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    } catch {
      // SSR / sandbox sem storage — ignora.
    }
  }, [prime]);
  return <>{children}</>;
}

const meta: Meta<typeof CookieBanner> = {
  title: "Components/CookieBanner",
  component: CookieBanner,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof CookieBanner>;

export const FirstVisit: Story = {
  name: "First visit (no consent yet)",
  render: () => (
    <WithStorage prime="clear">
      <CookieBanner />
    </WithStorage>
  ),
};

export const AlreadyConsented: Story = {
  name: "Already consented (banner hidden)",
  render: () => (
    <WithStorage prime="consented">
      <CookieBanner />
    </WithStorage>
  ),
};
