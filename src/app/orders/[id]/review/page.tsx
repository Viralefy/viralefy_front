"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMyReviewForOrder, submitReview } from "@/lib/api";
import type { Review } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Página de submissão de review pós-entrega. Trigger principal: link no
// email "how was your order?" enviado 7d após order.paid.
//
// Estados:
//   1. Loading — checa se já tem review pra esse order.
//   2. Already submitted — mostra o review existente + thanks.
//   3. Form — 5-star slider + title + body + submit.
//   4. Submitted — confirmação.
//   5. Errors — 404 (order não é seu) / 422 (input inválido) / 409 (já enviado).

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderID = params?.id ?? "";

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace(`/login?next=/orders/${orderID}/review`);
      return;
    }
    setToken(t);

    fetchMyReviewForOrder(t, orderID)
      .then((r) => setExisting(r))
      .catch((e) => {
        // 404 = nunca submetido ainda — caminho feliz, mostra o form.
        if (e instanceof Error && /404|not.?found/i.test(e.message)) {
          setExisting(null);
        } else if (e instanceof Error && /403|forbidden/i.test(e.message)) {
          setError("This order doesn't belong to your account.");
        } else {
          setExisting(null);
        }
      })
      .finally(() => setLoading(false));
  }, [orderID, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    if (rating < 1 || rating > 5) {
      setError("Pick a rating between 1 and 5 stars.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitReview(token, {
        order_id: orderID,
        rating,
        title: title.trim(),
        body: body.trim(),
        country_code: "us", // capturado server-side em versões futuras; default neutro
      });
      setSubmitted(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      if (/409|conflict/i.test(msg)) {
        setError("You already submitted a review for this order.");
      } else if (/422|invalid/i.test(msg)) {
        setError("Please fill in a rating between 1 and 5.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 640 }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/account">← My account</Link>
      </p>

      <h1 style={{ marginBottom: "0.5rem" }}>Leave a review</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Real feedback helps other buyers and us. Takes 30 seconds.
      </p>

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {!loading && error && !submitted && !existing && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>
      )}

      {!loading && submitted && (
        <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <p style={{ fontSize: "2rem", margin: 0 }}>{"★".repeat(submitted.rating)}{"☆".repeat(5 - submitted.rating)}</p>
          <h2 style={{ marginTop: "0.5rem", fontSize: "1.2rem" }}>Thanks for the review! 🙌</h2>
          <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
            Your feedback is live on the plan page. We&apos;ll keep it that way unless content terms are violated.
          </p>
          <Link href="/account" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
            Back to my orders
          </Link>
        </div>
      )}

      {!loading && !submitted && existing && (
        <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <p style={{ fontSize: "2rem", margin: 0 }}>{"★".repeat(existing.rating)}{"☆".repeat(5 - existing.rating)}</p>
          <h2 style={{ marginTop: "0.5rem", fontSize: "1.2rem" }}>You&apos;ve already reviewed this order</h2>
          {existing.title && <p style={{ fontWeight: 600, marginTop: "0.75rem" }}>{existing.title}</p>}
          {existing.body && <p style={{ color: "var(--muted)", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{existing.body}</p>}
          <Link href="/account" className="btn btn-outline" style={{ marginTop: "1rem", display: "inline-block" }}>
            Back to my orders
          </Link>
        </div>
      )}

      {!loading && !submitted && !existing && !error?.includes("doesn't belong") && (
        <form onSubmit={onSubmit} className="card">
          <label className="label" style={{ marginBottom: "0.4rem" }}>How many stars?</label>
          <StarPicker value={rating} onChange={setRating} />

          <label className="label" htmlFor="r-title" style={{ marginTop: "1rem" }}>Headline (optional)</label>
          <input
            id="r-title"
            className="input"
            placeholder="Sums it up in one line"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />

          <label className="label" htmlFor="r-body" style={{ marginTop: "1rem" }}>Details (optional)</label>
          <textarea
            id="r-body"
            className="input"
            rows={5}
            placeholder="How was the delivery? Anything that stood out?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            style={{ resize: "vertical" }}
          />

          {error && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <Link href="/account" className="btn btn-ghost">Cancel</Link>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.75rem", marginBottom: 0 }}>
            Reviews are public and tied to your account (first name + last initial). One review per order.
          </p>
        </form>
      )}
    </main>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.25rem", fontSize: "2rem", lineHeight: 1, userSelect: "none" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: n <= value ? "#f59e0b" : "var(--muted)",
            padding: "0.1rem 0.2rem",
          }}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
