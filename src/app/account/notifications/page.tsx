"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { NotifPrefs, WhatsAppPref } from "@/lib/api";
import {
  fetchNotifPrefs,
  updateNotifPrefs,
  fetchWhatsAppPref,
  updateWhatsApp,
} from "@/lib/api";
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
  const [wa, setWa] = useState<WhatsAppPref | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // WhatsApp tem fluxo de save separado: o endpoint é outro e o feedback
  // de "número inválido" precisa ser visível sem zerar o sucesso dos
  // toggles de email.
  const [waSaving, setWaSaving] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waSuccess, setWaSuccess] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    Promise.all([
      fetchNotifPrefs(token).then((p) => setPrefs(p)),
      fetchWhatsAppPref(token)
        .then((p) => setWa(p))
        .catch(() => setWa({ number: "", opt_in: false })),
    ])
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

  async function saveWhatsApp() {
    if (!wa) return;
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setWaSaving(true);
    setWaError(null);
    setWaSuccess(false);
    try {
      const updated = await updateWhatsApp(wa, token);
      setWa(updated);
      setWaSuccess(true);
    } catch (e) {
      setWaError(
        e instanceof Error ? e.message : "Failed to save WhatsApp settings",
      );
    } finally {
      setWaSaving(false);
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

      {/* WhatsApp opt-in (Fase 7.3). Card separado dos toggles de email
          porque o canal é diferente (PII + provider externo) e tem ciclo de
          save próprio. Em HML o sender é dry-run; UX já fica pronta pra
          quando o provider real (Meta Cloud API / Twilio) plugar. */}
      {!loading && wa && (
        <div className="card" style={{ padding: 0, marginTop: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem" }}>
            <strong style={{ display: "block" }}>WhatsApp</strong>
            <span
              style={{ color: "var(--muted)", fontSize: "0.9rem" }}
            >
              Receive transactional updates (order status, delivery
              confirmations) on WhatsApp. Number must include country code,
              e.g. +5511999999999.
            </span>
          </div>

          {waError && (
            <div
              className="alert alert-error"
              style={{ margin: "0 1.25rem 1rem" }}
            >
              {waError}
            </div>
          )}
          {waSuccess && (
            <div
              className="alert alert-success"
              style={{ margin: "0 1.25rem 1rem" }}
            >
              WhatsApp settings saved.
            </div>
          )}

          <div
            style={{
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <label style={{ display: "block" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                  marginBottom: "0.25rem",
                }}
              >
                WhatsApp number
              </span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+5511999999999"
                value={wa.number}
                onChange={(e) => {
                  const number = e.target.value;
                  setWa((p) => (p ? { ...p, number } : p));
                  setWaSuccess(false);
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  border: "1px solid var(--border)",
                  borderRadius: "0.4rem",
                  background: "var(--bg)",
                  color: "var(--fg)",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={wa.opt_in}
                onChange={() => {
                  setWa((p) => (p ? { ...p, opt_in: !p.opt_in } : p));
                  setWaSuccess(false);
                }}
                style={{
                  marginTop: "0.25rem",
                  width: "1.1rem",
                  height: "1.1rem",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "0.9rem" }}>
                Send me transactional WhatsApp messages. You can turn this
                off anytime. We never share your number.
              </span>
            </label>
          </div>

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
              onClick={saveWhatsApp}
              disabled={waSaving}
            >
              {waSaving ? "Saving…" : "Save WhatsApp"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
