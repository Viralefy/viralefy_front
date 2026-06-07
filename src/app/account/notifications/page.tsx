"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { NotifPrefs } from "@/lib/api";
import { fetchNotifPrefs, updateNotifPrefs } from "@/lib/api";
import { getToken } from "@/lib/auth";

// As 4 chaves canônicas + labels EN-only nesse round. A ordem aqui é a
// ordem visual dos toggles — ordenei por prioridade pro usuário:
// transacionais (order_updates) > engagement (reviews/cart) > marketing.
const TOGGLES: Array<{
  key: keyof NotifPrefs;
  title: string;
  description: string;
}> = [
  {
    key: "order_updates",
    title: "Order updates",
    description:
      "Status changes, delivery confirmations and refund notices. Recommended on.",
  },
  {
    key: "reviews",
    title: "Review requests",
    description:
      "We email you a few days after delivery asking how it went. One email per order.",
  },
  {
    key: "cart_recovery",
    title: "Cart recovery",
    description:
      "Reminders if you start a checkout but don't finish. Stops after you buy.",
  },
  {
    key: "marketing",
    title: "Marketing & promotions",
    description:
      "Occasional coupon drops and new-plan announcements. Off by default.",
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchNotifPrefs(token)
      .then((p) => setPrefs(p))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load preferences"),
      )
      .finally(() => setLoading(false));
  }, [router]);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => (p ? { ...p, [key]: !p[key] } : p));
    setSuccess(false);
  }

  async function save() {
    if (!prefs) return;
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateNotifPrefs(prefs, token);
      setPrefs(updated);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: "720px" }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/account"
          style={{ color: "var(--muted)", fontSize: "0.9rem" }}
        >
          ← Back to account
        </Link>
        <h1 style={{ marginTop: "0.5rem" }}>Notification preferences</h1>
        <p style={{ color: "var(--muted)" }}>
          Choose which emails we send you. You can change this anytime.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          Preferences saved.
        </div>
      )}

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {!loading && prefs && (
        <div className="card" style={{ padding: 0 }}>
          {TOGGLES.map((t, idx) => (
            <label
              key={t.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "1rem 1.25rem",
                borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={prefs[t.key]}
                onChange={() => toggle(t.key)}
                style={{
                  marginTop: "0.25rem",
                  width: "1.1rem",
                  height: "1.1rem",
                  cursor: "pointer",
                }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block" }}>{t.title}</strong>
                <span
                  style={{ color: "var(--muted)", fontSize: "0.9rem" }}
                >
                  {t.description}
                </span>
              </div>
            </label>
          ))}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
