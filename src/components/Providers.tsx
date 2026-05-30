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
  const [code, setCode] = useState<string>("BRL");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved) setCode(saved);
    fetchCurrencies()
      .then((list) => {
        setCurrencies(list);
        // Se a moeda salva não existe mais, cai na primeira disponível.
        if (list.length && !list.some((c) => c.code === (saved ?? code))) {
          setCode(list[0].code);
        }
      })
      .catch(() => setCurrencies([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCurrencyCode(c: string) {
    setCode(c);
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

  const currency = currencies.find((c) => c.code === code) ?? null;

  return (
    <AppContext.Provider value={{ currencies, currency, setCurrencyCode, user, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}
