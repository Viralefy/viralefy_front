"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { APIKey, CreateAPIKeyResult } from "@/lib/api";
import { createMyAPIKey, fetchMyAPIKeys, revokeMyAPIKey } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Página "Developer API" — gerenciamento de credenciais B2B.
//
// O segredo (plain key) só aparece UMA vez no modal logo após a criação;
// o backend persiste apenas SHA-256. Reload, navegação fora, ou simples
// fechar do modal e a key plain é perdida — usuário tem que criar outra.
//
// V2 roadmap: rate-limit per-key + billing por chamada.

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function APIKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<APIKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<CreateAPIKeyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const list = await fetchMyAPIKeys(token);
      setKeys(list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load API keys");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    const token = getToken();
    if (!token) return;
    const label = newLabel.trim();
    if (!label) {
      setError("Label is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await createMyAPIKey(label, token);
      setJustCreated(res);
      setNewLabel("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    const token = getToken();
    if (!token) return;
    if (!confirm("Revoke this API key? Integrations using it will stop working immediately.")) {
      return;
    }
    setRevoking(id);
    setError(null);
    try {
      await revokeMyAPIKey(id, token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setRevoking(null);
    }
  }

  async function copyPlain() {
    if (!justCreated?.key) return;
    try {
      await navigator.clipboard.writeText(justCreated.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard pode estar bloqueado */
    }
  }

  function closeModal() {
    // Fechar o "just created" modal apaga o plain in-memory — não há
    // recuperação. Confirmamos pra evitar perda acidental.
    if (justCreated && !confirm("Did you save the key? It won't be shown again.")) {
      return;
    }
    setJustCreated(null);
    setShowModal(false);
  }

  const activeKeys = (keys ?? []).filter((k) => !k.revoked_at);
  const revokedKeys = (keys ?? []).filter((k) => !!k.revoked_at);

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/account" style={{ color: "var(--muted)" }}>
          ← My account
        </Link>
      </div>

      <h1 style={{ marginBottom: "0.5rem" }}>Developer API</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Programmatic access to public endpoints (plans, order status). Send
        your key in the <code>X-API-Key</code> header on requests to{" "}
        <code>/v2/*</code>.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowModal(true);
            setJustCreated(null);
            setNewLabel("");
          }}
        >
          Create new key
        </button>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Active keys</h2>
      {keys === null ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : activeKeys.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No active keys.</p>
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: "2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "start", color: "var(--muted)", fontSize: "0.85rem" }}>
                <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>Label</th>
                <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>Created</th>
                <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>Last used</th>
                <th scope="col" style={{ padding: "0.6rem 0.8rem", textAlign: "end" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((k) => (
                <tr key={k.id} style={{ borderTop: "1px solid var(--border, #222)" }}>
                  <td style={{ padding: "0.6rem 0.8rem" }}>{k.label}</td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>
                    {formatDate(k.created_at)}
                  </td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>
                    {formatDate(k.last_used_at)}
                  </td>
                  <td style={{ padding: "0.6rem 0.8rem", textAlign: "end" }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleRevoke(k.id)}
                      disabled={revoking === k.id}
                    >
                      {revoking === k.id ? "Revoking…" : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revokedKeys.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem", color: "var(--muted)" }}>
            Revoked
          </h2>
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "start", color: "var(--muted)", fontSize: "0.85rem" }}>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>Label</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>Created</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>Revoked</th>
                </tr>
              </thead>
              <tbody>
                {revokedKeys.map((k) => (
                  <tr key={k.id} style={{ borderTop: "1px solid var(--border, #222)" }}>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>{k.label}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>
                      {formatDate(k.created_at)}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>
                      {formatDate(k.revoked_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: "560px", width: "100%", padding: "1.5rem" }}
          >
            {!justCreated ? (
              <>
                <h2 style={{ marginBottom: "1rem" }}>Create new API key</h2>
                <label
                  htmlFor="vf-apikey-label"
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    color: "var(--muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Label (visible only to you)
                </label>
                {/* a11y: label-input pairing — sem htmlFor o screen reader não
                    anuncia "Label" ao focar o input (WCAG 1.3.1 / 4.1.2). */}
                <input
                  id="vf-apikey-label"
                  name="apikey_label"
                  type="text"
                  className="input"
                  placeholder="e.g. Production server"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  maxLength={80}
                  minLength={1}
                  style={{ width: "100%", marginBottom: "1rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={creating || !newLabel.trim()}
                  >
                    {creating ? "Creating…" : "Create key"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: "0.5rem" }}>Your new API key</h2>
                <p
                  style={{
                    color: "var(--warn, #f59e0b)",
                    marginBottom: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Copy and store this key now. For security reasons,{" "}
                  <strong>it will not be shown again</strong>.
                </p>
                <code
                  style={{
                    display: "block",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "6px",
                    background: "var(--surface-2, #11141a)",
                    fontSize: "0.9rem",
                    overflowWrap: "anywhere",
                    marginBottom: "1rem",
                    userSelect: "all",
                  }}
                >
                  {justCreated.key}
                </code>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-outline" onClick={copyPlain}>
                    {copied ? "Copied!" : "Copy key"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={closeModal}>
                    I saved it — close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div
        className="card"
        style={{ marginTop: "2rem", padding: "1rem 1.25rem", color: "var(--muted)" }}
      >
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text, inherit)" }}>
          Usage
        </h2>
        <p style={{ marginBottom: "0.4rem" }}>
          <code>GET /v2/plans</code> — list active plans.
        </p>
        <p style={{ marginBottom: "0.4rem" }}>
          <code>GET /v2/orders/{"{id}"}/status</code> — read-only status of an order.
        </p>
        <p style={{ fontSize: "0.85rem", marginTop: "0.6rem" }}>
          Per-key rate limits and billing are not enforced yet — coming in v2.5.
        </p>
      </div>
    </main>
  );
}
