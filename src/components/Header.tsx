"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "./Providers";

export function Header() {
  const { currencies, currency, setCurrencyCode, user, logout } = useApp();
  const router = useRouter();

  return (
    <header
      className="container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        paddingTop: "1.25rem",
        paddingBottom: "1.25rem",
        flexWrap: "wrap",
      }}
    >
      <Link href="/" style={{ color: "var(--text)", textDecoration: "none" }}>
        <strong style={{ fontSize: "1.4rem" }}>Viralefy</strong>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <select
          aria-label="Moeda"
          className="input"
          style={{ width: "auto", padding: "0.5rem 0.75rem" }}
          value={currency?.code ?? "BRL"}
          onChange={(e) => setCurrencyCode(e.target.value)}
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>

        {user ? (
          <>
            <Link href="/account" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              Minha conta
            </Link>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: "0.5rem 1rem" }}
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              Entrar
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
              Criar conta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
