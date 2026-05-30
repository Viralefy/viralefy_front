"use client";

import Image from "next/image";
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
      <Link href="/" aria-label="Viralefy" style={{ display: "inline-flex" }}>
        <Image
          src="/logo.png"
          alt="Viralefy"
          width={2471}
          height={704}
          priority
          style={{ height: 36, width: "auto" }}
        />
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
            <Link href="/tickets" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              Suporte
            </Link>
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
