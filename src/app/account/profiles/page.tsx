"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Platform, Profile } from "@/lib/api";
import { addProfile, deleteProfile, fetchMyProfiles } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Icon, type IconName } from "@/components/Icon";

const PLATFORMS: { code: Platform; label: string; icon: IconName }[] = [
  { code: "instagram", label: "Instagram", icon: "instagram" },
  { code: "tiktok", label: "TikTok", icon: "tiktok" },
];

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setProfiles(await fetchMyProfiles(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    setAdding(true);
    try {
      await addProfile(token, {
        platform: fd.get("platform") as Platform,
        handle: String(fd.get("handle")),
        display_name: String(fd.get("display_name") ?? "") || undefined,
      });
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add profile");
    } finally {
      setAdding(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Remove the profile "${name}"?`)) return;
    const token = getToken();
    if (!token) return;
    try {
      await deleteProfile(token, id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  const byPlatform = (p: Platform) => profiles.filter((x) => x.platform === p);

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 720 }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/account">← My account</Link>
      </p>

      <h1 style={{ marginBottom: "0.5rem" }}>Profiles</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Register the profiles that will receive the services. You pick which profile to use when you buy.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onAdd} className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Add profile</h2>
        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label className="label" htmlFor="platform">Platform</label>
            <select className="input" name="platform" id="platform" defaultValue="instagram">
              {PLATFORMS.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="handle">@ handle</label>
            {/* Handles do Instagram/TikTok seguem o mesmo subset estrito (letras,
                números, ponto, underscore) e cap em 30 chars — BUG-16 do QA
                2026-06-12 (formulário aceitava handle inválido como "user!@#").
                Aplicamos pattern + maxLength no client pra rejeitar antes de bater
                no backend. minLength=1 idem IG/TT. */}
            <input
              className="input"
              name="handle"
              id="handle"
              placeholder="yourhandle"
              required
              maxLength={30}
              pattern="[A-Za-z0-9._]{1,30}"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              title="Letters, numbers, dot or underscore. Up to 30 chars."
            />
          </div>
          <div>
            <label className="label" htmlFor="display_name">Nickname (optional)</label>
            <input className="input" name="display_name" id="display_name" placeholder="Personal, Brand…" maxLength={60} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }} disabled={adding}>
          {adding ? "Saving…" : "Add profile"}
        </button>
      </form>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : profiles.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>No profiles registered yet.</p>
        </div>
      ) : (
        PLATFORMS.map((pl) => {
          const list = byPlatform(pl.code);
          if (list.length === 0) return null;
          return (
            <section key={pl.code} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <Icon name={pl.icon} size={16} />
                {pl.label}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {list.map((p) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
                  >
                    <div>
                      <strong>@{p.handle}</strong>
                      {p.display_name && (
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}> — {p.display_name}</span>
                      )}
                      {p.verified && (
                        <span style={{ marginInlineStart: "0.5rem", fontSize: "0.75rem", color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <Icon name="check" size={12} />
                          verified
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                      onClick={() => onDelete(p.id, p.handle)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
