"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { MyReferral } from "@/lib/api";
import { fetchMyReferral } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApp } from "@/components/Providers";
import { formatBalance } from "@/lib/format";

// Página "Refer & earn" — exibe código próprio + share links + métricas.
// O reward é dado em USD-cents e creditado na conta de créditos do
// referrer no primeiro pagamento confirmado do referred.

export default function ReferralPage() {
  const router = useRouter();
  const { currency } = useApp();
  const [data, setData] = useState<MyReferral | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMyReferral(token)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [router]);

  // Link compartilhável aponta pra root com ?ref=<code>. tracking.ts
  // captura no primeiro init e persiste por 30 dias.
  const shareUrl = useMemo(() => {
    if (!data?.code) return "";
    if (typeof window === "undefined") return `/?ref=${data.code}`;
    return `${window.location.origin}/?ref=${data.code}`;
  }, [data?.code]);

  const shareText = useMemo(
    () =>
      data?.code
        ? `I use Viralefy to grow my Instagram & TikTok — here's my invite: ${shareUrl}`
        : "",
    [data?.code, shareUrl],
  );

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* engole — clipboard pode estar bloqueado */
    }
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/account" style={{ color: "var(--muted)" }}>
          ← My account
        </Link>
      </div>

      <h1 style={{ marginBottom: "0.5rem" }}>Refer & earn</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Share your link. When someone signs up and pays for the first time,
        you earn 5% of their order as credit.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {!data ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
              Your invite link
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <code
                style={{
                  flex: "1 1 320px",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "6px",
                  background: "var(--surface-2, #11141a)",
                  fontSize: "0.95rem",
                  overflowWrap: "anywhere",
                }}
              >
                {shareUrl}
              </code>
              <button type="button" className="btn btn-primary" onClick={copyLink}>
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <a
                className="btn btn-outline"
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
              <a
                className="btn btn-outline"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on X
              </a>
              <a
                className="btn btn-outline"
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("I use Viralefy to grow my profile")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on Telegram
              </a>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
              marginBottom: "2rem",
            }}
          >
            <div className="card">
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Your code</div>
              <strong style={{ fontSize: "1.25rem" }}>{data.code}</strong>
            </div>
            <div className="card">
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>People referred</div>
              <strong style={{ fontSize: "1.25rem" }}>{data.total_referred}</strong>
            </div>
            <div className="card">
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Earned</div>
              <strong style={{ fontSize: "1.25rem" }}>
                {formatBalance(data.total_earned_cents, currency)}
              </strong>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>How it works</h2>
            <ol style={{ color: "var(--muted)", lineHeight: 1.6, paddingLeft: "1.2rem" }}>
              <li>Share your invite link above.</li>
              <li>When a new user signs up via your link, they&apos;re tagged as your referral.</li>
              <li>The first time they pay for any plan, you receive 5% of the amount as credit.</li>
              <li>Your credit goes straight to your <Link href="/account/credits">balance</Link>.</li>
            </ol>
          </div>
        </>
      )}
    </main>
  );
}
