"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./Providers";
import { langOfCountry, tr } from "@/i18n/languages";
import { getCountry } from "@/i18n/countries";

// Header derive o idioma do path: o primeiro segmento é o país, o lang
// vem do mapa em `languages.ts`. Caso o path não bata (login, register,
// legal, root), cai no inglês.
function langFromPath(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (!seg) return "en" as const;
  if (getCountry(seg)) return langOfCountry(seg);
  return "en" as const;
}

export function Header() {
  const { currencies, currency, setCurrencyCode, user, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const lang = langFromPath(pathname ?? "");
  const t = tr(lang);

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
          aria-label={t.header.currency}
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
              {t.header.support}
            </Link>
            <Link href="/account" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              {t.header.account}
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
              {t.header.logout}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              {t.header.login}
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
              {t.header.register}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
