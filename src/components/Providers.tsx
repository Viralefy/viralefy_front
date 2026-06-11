"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency, PPPEntry, Session, User } from "@/lib/api";
import { fetchCountryPPP, fetchCurrencies } from "@/lib/api";
import { clearSession, getUser, saveSession } from "@/lib/auth";
import { initTracking } from "@/lib/tracking";

type AppState = {
  currencies: Currency[];
  currency: Currency | null;
  setCurrencyCode: (code: string) => void;
  user: User | null;
  login: (s: Session) => void;
  logout: () => void;
  // PPP (Fase 6.5) — multiplier por country_code lowercase. Vazio enquanto a
  // call /v1/country-ppp não resolve; consumidores devem tratar ausência como
  // multiplier 1.00 (priceForCountry() já faz isso).
  pppMap: Record<string, number>;
};

const CURRENCY_KEY = "viralefy_currency";
const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  // Catálogo PPP em memória. Baixado uma vez no mount; tabela pequena (<50
  // linhas) → custo trivial. Consumido por priceForCountry() pra ajustar
  // display_amount ao poder de compra local.
  const [pppMap, setPppMap] = useState<Record<string, number>>({});
  // Padrão global: USDT. É a moeda de liquidação canônica e fica 1:1 com
  // USD pra visitantes globais (símbolo "$"). Antes era USD; antes ainda
  // era BRL (acidente histórico do MVP brasileiro). Visitante novo cai em
  // USDT até `/api/geo` decidir outra (BR→BRL, EU→EUR, etc.) ou o seletor
  // sobrescrever.
  const [code, setCode] = useState<string>("USDT");
  const [user, setUser] = useState<User | null>(null);
  // Marca que o usuário escolheu a moeda manualmente (ou já tinha cookie). Se
  // verdadeiro, ignoramos qualquer resposta de `/api/geo` que chegar atrasada.
  const [userSet, setUserSet] = useState<boolean>(false);

  useEffect(() => {
    setUser(getUser());
    // First-touch tracking captura na primeira pintura do client.
    // UTM/fbclid/etc. da URL atual + landing_url + referrer + viewport
    // ficam em sessionStorage pra serem anexados em checkout/recovery.
    initTracking();
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved) {
      setCode(saved);
      setUserSet(true);
    }

    let cancelled = false;

    // Auto-detect via header geo (Cloudflare/Vercel) ou Accept-Language. Só
    // aplica se o usuário ainda não tem preferência salva (preferência local
    // sempre vence).
    if (!saved) {
      fetch("/api/geo", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          const wanted = j?.data?.currency as string | undefined;
          if (wanted && !userSet) {
            // Não persistimos — é apenas o default da sessão. Se o usuário
            // mexer no seletor é que salvamos em localStorage.
            setCode(wanted);
          }
        })
        .catch(() => undefined);
    }

    // PPP catalog — best-effort. Falha de rede mantém mapa vazio (=preço cheio).
    fetchCountryPPP()
      .then((list: PPPEntry[]) => {
        if (cancelled) return;
        const m: Record<string, number> = {};
        for (const e of list) m[e.country_code.toLowerCase()] = e.multiplier;
        setPppMap(m);
      })
      .catch(() => undefined);

    fetchCurrencies()
      .then((list) => {
        if (cancelled) return;
        setCurrencies(list);
        // Se a moeda salva (ou USD default) não existe mais, cai na primeira
        // disponível, com preferência por USD → EUR → primeira da lista.
        const want = saved ?? code;
        if (list.length && !list.some((c) => c.code === want)) {
          const fallback = list.find((c) => c.code === "USDT")
            ?? list.find((c) => c.code === "USD")
            ?? list.find((c) => c.code === "EUR")
            ?? list[0];
          setCode(fallback.code);
        }
      })
      .catch(() => setCurrencies([]));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCurrencyCode(c: string) {
    setCode(c);
    setUserSet(true);
    localStorage.setItem(CURRENCY_KEY, c);
  }

  function login(s: Session) {
    saveSession(s);
    // Login unificado: user da loja OU admin com mais permissões. Pra UI
    // de header/account, mostramos o User no caso normal e sintetizamos
    // um pseudo-User a partir do AdminPrincipal quando subject_kind=admin
    // (mesmo email pode ter conta nas 2 tabelas; o admin login não invalida
    // a presença de user data).
    if (s.user) {
      setUser(s.user);
    } else if (s.admin) {
      setUser({
        ID: s.admin.ID,
        Email: s.admin.Email,
        Name: s.admin.Name ?? s.admin.Email,
        Phone: "",
        Telegram: "",
      } as User);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const currency =
    currencies.find((c) => c.code === code)
    ?? currencies.find((c) => c.code === "USDT")
    ?? currencies.find((c) => c.code === "USD")
    ?? null;

  return (
    <AppContext.Provider value={{ currencies, currency, setCurrencyCode, user, login, logout, pppMap }}>
      {children}
    </AppContext.Provider>
  );
}
