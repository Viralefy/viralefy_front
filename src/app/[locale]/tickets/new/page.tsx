"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createTicket } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function NewTicketPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const t = await createTicket(token, {
        subject: String(fd.get("subject")),
        body: String(fd.get("body")),
        order_id: (String(fd.get("order_id") ?? "").trim() || null),
      });
      router.push(`/tickets/${t.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 640, paddingTop: "2rem", paddingBottom: "4rem" }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/tickets">← My tickets</Link>
      </p>
      <div className="card">
        <h1 style={{ marginBottom: "0.5rem" }}>Open ticket</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Describe your question or issue. Our team replies here and also sends an email.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div>
            <label className="label" htmlFor="subject">Subject</label>
            {/* minLength=4 fecha o caminho mais comum de spam (subject "a"/"oi"
                /etc.) sem ferir UX legítima. Combina com W-307/308 do round 17
                que já tinha maxLength em body/order_id. */}
            <input className="input" id="subject" name="subject" placeholder="E.g.: Order #ABC123 didn't arrive" required minLength={4} maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="body">Message</label>
            <textarea
              className="input"
              id="body"
              name="body"
              rows={6}
              required
              minLength={10}
              maxLength={8000}
              placeholder="Describe what happened in detail. The more context, the faster we can resolve it."
            />
          </div>
          <div>
            <label className="label" htmlFor="order_id">Order ID (optional)</label>
            <input className="input" id="order_id" name="order_id" maxLength={64} placeholder="Paste the ID if related to a specific order" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
