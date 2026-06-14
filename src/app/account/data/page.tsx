"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cancelDeletion,
  exportMyData,
  requestDeletion,
  type DeletionRequest,
  type ExportedData,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

// Manage my data (LGPD/GDPR — Fase 5.2).
//
// Dois cards independentes:
//   1. Export — clica, baixa um JSON com tudo. Best-effort no backend:
//      tabelas opcionais (notif_prefs) caem fora se a migração não
//      tiver rodado; o user nunca recebe erro 500.
//   2. Delete — mostra estado atual (sem pedido / pedido pendente /
//      cancelado). Submit exige check de "I understand" pra evitar
//      click acidental. Cancel disponível enquanto status = pending.
//
// Hard-delete físico fica como tech debt (cron futuro). Aqui só
// registramos a intenção e o backend devolve executes_at = now + 30d.
export default function DataPage() {
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deletion, setDeletion] = useState<DeletionRequest | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Carga inicial só pra detectar se já há pedido pendente. Reusa o
  // export (gratuito porque chamamos sob token já válido) — o dump
  // inteiro vem mas só lemos `deletion_request`. Mantém uma chamada
  // só em vez de criar GET dedicado.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    exportMyData(token)
      .then((d: ExportedData) => setDeletion(d.deletion_request ?? null))
      .catch(() => {
        // Silencioso aqui — erros aparecem só no fluxo do botão.
      });
  }, [router]);

  async function onExport() {
    const token = getToken();
    if (!token) return;
    setExportError(null);
    setExportLoading(true);
    try {
      const data = await exportMyData(token);
      // Client-side download: cria blob, gera URL temporária e clica
      // num <a> invisível. Funciona em todos os browsers modernos
      // sem depender do Content-Disposition do servidor (que é
      // ignorado quando o fetch é via JS).
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "viralefy-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  }

  async function onRequestDeletion(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!confirmed) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await requestDeletion(token, { reason });
      // Re-fetch leve pra atualizar o estado da UI.
      const data = await exportMyData(token);
      setDeletion(data.deletion_request ?? null);
      setReason("");
      setConfirmed(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function onCancelDeletion() {
    const token = getToken();
    if (!token) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await cancelDeletion(token);
      const data = await exportMyData(token);
      setDeletion(data.deletion_request ?? null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const pending = deletion?.status === "pending";

  return (
    <main
      className="container"
      style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 760 }}
    >
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/account">← My account</Link>
      </p>

      <h1 style={{ marginBottom: "0.5rem" }}>Manage my data</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Download a copy of everything we have about you, or request account
        deletion. You can cancel the deletion request within 30 days.
      </p>

      {/* ---- Card: Export ---- */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
          Export my data
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "0.9rem",
            marginBottom: "0.75rem",
          }}
        >
          A JSON file with your account, orders, tickets, profiles, reviews and
          notification preferences.
        </p>
        {exportError && <div className="alert alert-error">{exportError}</div>}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onExport}
          disabled={exportLoading}
        >
          {exportLoading ? "Preparing…" : "Download viralefy-data.json"}
        </button>
      </div>

      {/* ---- Card: Delete ---- */}
      <div className="card">
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
          Delete my account
        </h2>

        {deleteError && <div className="alert alert-error">{deleteError}</div>}

        {pending && deletion ? (
          <>
            <p
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
              }}
            >
              Deletion scheduled for{" "}
              <strong>{new Date(deletion.executes_at).toLocaleString()}</strong>.
              You can cancel until then.
            </p>
            {deletion.reason && (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Reason: {deletion.reason}
              </p>
            )}
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancelDeletion}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? "Working…" : "Cancel deletion request"}
            </button>
          </>
        ) : (
          <form onSubmit={onRequestDeletion}>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
              }}
            >
              Your account will be scheduled for deletion in 30 days. During
              that window you can cancel from this page.
            </p>

            <label className="label" htmlFor="reason">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              className="input"
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let us know why — it helps us improve."
              style={{ marginBottom: "0.75rem" }}
            />

            <label
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-start",
                fontSize: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ marginTop: "0.2rem" }}
              />
              <span>
                I understand my orders, tickets, profiles and credits will be
                permanently removed after 30 days.
              </span>
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!confirmed || deleteSubmitting}
              style={{ background: "var(--danger, #c0392b)", borderColor: "var(--danger, #c0392b)" }}
            >
              {deleteSubmitting ? "Submitting…" : "Request deletion"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
