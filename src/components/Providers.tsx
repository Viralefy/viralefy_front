"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency, PPPEntry, Session, User } from "@/lib/api";
import { fetchCountryPPP, fetchCurrencies } from "@/lib/api";
import { clearSession, getUser, saveSession } from "@/lib/auth";
import { initTracking } from "@/lib/tracking";
import { CURRENCY_CHANGED_EVENT, getStoredCurrency, storeCurrency } from "@/lib/currency";

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

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}

export function Providers({
  children,
  initialCurrency = null,
}: {
  children: React.ReactNode;
  /**
   * Moeda lida do cookie no SSR (layout.tsx). Quando presente, garante
   * que o primeiro paint client-side já mostre a moeda salva — sem o
   * salto USD→USDT relatado em BUG-79/111.
   */
  initialCurrency?: string | null;
}) {
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
  //
  // Quando `initialCurrency` chega do SSR (cookie lido no layout) usamos
  // ele como estado inicial — sem isso o primeiro render é USDT e só
  // depois do useEffect a moeda salva aparece, gerando o flash relatado.
  const [code, setCode] = useState<string>(initialCurrency ?? "USDT");
  const [user, setUser] = useState<User | null>(null);
  // Marca que o usuário escolheu a moeda manualmente (ou já tinha cookie). Se
  // verdadeiro, ignoramos qualquer resposta de `/api/geo` que chegar atrasada.
  const [userSet, setUserSet] = useState<boolean>(Boolean(initialCurrency));

  useEffect(() => {
    setUser(getUser());
    // First-touch tracking captura na primeira pintura do client.
    // UTM/fbclid/etc. da URL atual + landing_url + referrer + viewport
    // ficam em sessionStorage pra serem anexados em checkout/recovery.
    initTracking();
    // Cookie (cross-subdomain) é a verdade; LS fica como fallback legacy.
    // Se o SSR já passou `initialCurrency`, isso só revalida — `saved`
    // deveria bater. Se não passou (SSR sem cookie + LS legado existe),
    // hidrata aqui.
    const saved = getStoredCurrency();
    if (saved && saved !== code) {
      setCode(saved);
      setUserSet(true);
    } else if (saved) {
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
            // mexer no seletor é que salvamos em cookie+LS.
            setCode(wanted);
          }
        })
        .catch(() => undefined);
    }

    // Subdomain crossover: outra aba/host pode ter mudado a moeda.
    // Reagimos ao evento global pra refletir sem reload.
    function onCurrencyChanged(e: Event) {
      const ce = e as CustomEvent<string>;
      if (typeof ce.detail === "string" && ce.detail !== code) {
        setCode(ce.detail);
        setUserSet(true);
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener(CURRENCY_CHANGED_EVENT, onCurrencyChanged);
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
      if (typeof window !== "undefined") {
        window.removeEventListener(CURRENCY_CHANGED_EVENT, onCurrencyChanged);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCurrencyCode(c: string) {
    setCode(c);
    setUserSet(true);
    // Persistência canônica: cookie cross-subdomain + LS legacy + evento.
    // Sem o cookie, a moeda não sobrevive a uma navegação SSR (caía em
    // USDT no próximo render — BUG-79/111).
    storeCurrency(c);
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
