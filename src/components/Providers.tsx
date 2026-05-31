"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency, Session, User } from "@/lib/api";
import { fetchCurrencies } from "@/lib/api";
import { clearSession, getUser, saveSession } from "@/lib/auth";

type AppState = {
  currencies: Currency[];
  currency: Currency | null;
  setCurrencyCode: (code: string) => void;
  user: User | null;
  login: (s: Session) => void;
  logout: () => void;
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
  // Padrão global: USD. Antes era BRL (acidente histórico do MVP brasileiro).
  // Visitante novo cai em USD a menos que sobrescreva pelo seletor — ou que
  // o `/api/geo` resolva pra outra moeda compatível.
  const [code, setCode] = useState<string>("USD");
  const [user, setUser] = useState<User | null>(null);
  // Marca que o usuário escolheu a moeda manualmente (ou já tinha cookie). Se
  // verdadeiro, ignoramos qualquer resposta de `/api/geo` que chegar atrasada.
  const [userSet, setUserSet] = useState<boolean>(false);

  useEffect(() => {
    setUser(getUser());
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

    fetchCurrencies()
      .then((list) => {
        if (cancelled) return;
        setCurrencies(list);
        // Se a moeda salva (ou USD default) não existe mais, cai na primeira
        // disponível, com preferência por USD → EUR → primeira da lista.
        const want = saved ?? code;
        if (list.length && !list.some((c) => c.code === want)) {
          const fallback = list.find((c) => c.code === "USD")
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
    setUser(s.user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const currency = currencies.find((c) => c.code === code) ?? currencies.find((c) => c.code === "USD") ?? null;

  return (
    <AppContext.Provider value={{ currencies, currency, setCurrencyCode, user, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}
