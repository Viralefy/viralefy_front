"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CheckoutResult, Plan, Platform, Profile, CreditAccount } from "@/lib/api";
import { checkout, fetchCredits, fetchMyProfiles } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { getToken } from "@/lib/auth";
import { useApp } from "./Providers";

export function CheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { currency, user } = useApp();
  const isProfile = plan.target_type === "profile";
  const platformLabel = plan.platform === "tiktok" ? "TikTok" : "Instagram";
  const platformIcon = plan.platform === "tiktok" ? "🎵" : "📷";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [credit, setCredit] = useState<CreditAccount | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [useNewProfile, setUseNewProfile] = useState(false);
  const [payMethod, setPayMethod] = useState<"gateway" | "credits">("gateway");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (isProfile) {
      fetchMyProfiles(token)
        .then((all) => {
          const filt = all.filter((p) => p.platform === plan.platform);
          setProfiles(filt);
          if (filt.length > 0) {
            setSelectedProfileId(filt[0].id);
            setUseNewProfile(false);
          } else {
            setUseNewProfile(true);
          }
        })
        .catch(() => setProfiles([]));
    }
    fetchCredits(token).then(setCredit).catch(() => undefined);
  }, [isProfile, plan.platform]);

  const enoughCredits = credit ? credit.balance_cents >= plan.price_cents : false;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const token = getToken() ?? undefined;
    try {
      const payload: Parameters<typeof checkout>[0] = {
        plan_id: plan.id,
        email: String(fd.get("email") ?? user?.email ?? ""),
        name: String(fd.get("name") ?? user?.name ?? ""),
        display_currency: currency?.code ?? "BRL",
        payment_method: payMethod,
      };
      if (isProfile) {
        if (user && profiles && !useNewProfile && selectedProfileId) {
          payload.profile_id = selectedProfileId;
        } else {
          payload.new_profile = {
            platform: plan.platform as Platform,
            handle: String(fd.get("handle") ?? ""),
            display_name: String(fd.get("display_name") ?? "") || undefined,
          };
        }
      } else {
        payload.publication_url = String(fd.get("publication_url") ?? "");
      }
      const res = await checkout(payload, token);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "1rem",
      }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {result ? (
          <CheckoutSuccess result={result} onClose={onClose} />
        ) : (
          <>
            <h2 style={{ marginBottom: "0.25rem" }}>Finalizar compra</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              {platformIcon} {platformLabel} · {isProfile ? "envia para o perfil" : "envia para a publicação"}
            </p>
            <p style={{ marginBottom: "1.25rem" }}>
              <strong>{plan.name}</strong> — {priceFor(plan, currency)}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div className="alert alert-error">{error}</div>}

              {!user && (
                <>
                  <div>
                    <label className="label" htmlFor="name">Nome completo</label>
                    <input className="input" id="name" name="name" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="email">E-mail</label>
                    <input className="input" id="email" name="email" type="email" required />
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
                    Vamos criar sua conta e enviar a senha por e-mail.
                  </p>
                </>
              )}

              {isProfile ? (
                <ProfileSection
                  user={!!user}
                  profiles={profiles}
                  platform={plan.platform}
                  platformLabel={platformLabel}
                  platformIcon={platformIcon}
                  selectedProfileId={selectedProfileId}
                  setSelectedProfileId={setSelectedProfileId}
                  useNewProfile={useNewProfile}
                  setUseNewProfile={setUseNewProfile}
                />
              ) : (
                <PublicationSection platform={plan.platform} platformLabel={platformLabel} platformIcon={platformIcon} />
              )}

              {user && credit && (
                <PaymentMethodSection
                  credit={credit}
                  priceCents={plan.price_cents}
                  enough={enoughCredits}
                  payMethod={payMethod}
                  setPayMethod={setPayMethod}
                />
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Processando…" : payMethod === "credits" ? "Pagar com créditos" : "Confirmar pedido"}
              </button>
            </form>
            <button type="button" className="btn btn-outline" style={{ marginTop: "1rem", width: "100%" }} onClick={onClose}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileSection({
  user, profiles, platformLabel, platformIcon,
  selectedProfileId, setSelectedProfileId, useNewProfile, setUseNewProfile,
}: {
  user: boolean;
  profiles: Profile[] | null;
  platform: Platform;
  platformLabel: string;
  platformIcon: string;
  selectedProfileId: string;
  setSelectedProfileId: (s: string) => void;
  useNewProfile: boolean;
  setUseNewProfile: (b: boolean) => void;
}) {
  if (!user) {
    return (
      <div>
        <label className="label" htmlFor="handle">{platformIcon} @ no {platformLabel}</label>
        <input className="input" id="handle" name="handle" placeholder="seuperfil" required />
      </div>
    );
  }
  return (
    <div>
      <label className="label">{platformIcon} Perfil de {platformLabel}</label>
      {profiles && profiles.length > 0 && !useNewProfile ? (
        <>
          <select className="input" value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                @{p.handle}{p.display_name ? ` — ${p.display_name}` : ""}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.25rem 0" }} onClick={() => setUseNewProfile(true)}>
            + Adicionar outro perfil
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input className="input" name="handle" placeholder="@ usuário" required />
            <input className="input" name="display_name" placeholder="Apelido (opcional)" />
          </div>
          {profiles && profiles.length > 0 && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.25rem 0" }} onClick={() => setUseNewProfile(false)}>
              ← Usar perfil existente
            </button>
          )}
        </>
      )}
    </div>
  );
}

function PublicationSection({ platform, platformLabel, platformIcon }: { platform: Platform; platformLabel: string; platformIcon: string }) {
  const placeholder =
    platform === "tiktok"
      ? "https://www.tiktok.com/@usuario/video/123…"
      : "https://www.instagram.com/p/ABC123/ ou /reel/…";
  return (
    <div>
      <label className="label" htmlFor="publication_url">{platformIcon} URL da publicação ({platformLabel})</label>
      <input className="input" id="publication_url" name="publication_url" placeholder={placeholder} required />
      <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
        Cole o link do post/vídeo onde o serviço será aplicado.
      </p>
    </div>
  );
}

function PaymentMethodSection({
  credit, priceCents, enough, payMethod, setPayMethod,
}: {
  credit: CreditAccount;
  priceCents: number;
  enough: boolean;
  payMethod: "gateway" | "credits";
  setPayMethod: (m: "gateway" | "credits") => void;
}) {
  return (
    <div>
      <label className="label">Pagar com</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <button type="button" className={payMethod === "gateway" ? "btn btn-primary" : "btn btn-outline"} onClick={() => setPayMethod("gateway")}>
          💳 Pagamento externo
        </button>
        <button
          type="button"
          className={payMethod === "credits" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => enough && setPayMethod("credits")}
          disabled={!enough}
          title={enough ? "" : "Saldo insuficiente"}
        >
          💎 Créditos
        </button>
      </div>
      <p style={{ color: enough ? "var(--muted)" : "var(--danger)", fontSize: "0.78rem", marginTop: "0.4rem" }}>
        Saldo: R$ {(credit.balance_cents / 100).toFixed(2)}
        {!enough && ` — faltam R$ ${((priceCents - credit.balance_cents) / 100).toFixed(2)}. `}
        {!enough && <Link href="/account/credits" style={{ color: "var(--accent)" }}>Recarregar</Link>}
      </p>
    </div>
  );
}

function CheckoutSuccess({ result, onClose }: { result: CheckoutResult; onClose: () => void }) {
  return (
    <>
      <h2 style={{ marginBottom: "0.75rem" }}>Pedido criado! 🎉</h2>
      <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
        Pedido <strong>#{result.order_id.slice(0, 8)}</strong> do plano <strong>{result.plan_name}</strong>.
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <li>Valor: <strong>{result.display_symbol} {result.display_amount}</strong></li>
        {result.payment_method === "credits" ? (
          <>
            <li style={{ color: "var(--success)" }}>✓ Pago com créditos</li>
            <li style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Saldo restante: R$ {((result.credit_balance_cents ?? 0) / 100).toFixed(2)}
            </li>
          </>
        ) : (
          <li>Cobrança em: <strong>{result.settlement_amount} {result.settlement_currency}</strong></li>
        )}
      </ul>

      {result.payment_method === "gateway" && <PaymentInstructions result={result} />}

      {result.account_created ? (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Conta criada para <strong>{result.email}</strong>. {result.email_sent ? "Enviamos a senha e as instruções por e-mail." : "Falha no envio — abra um ticket."}
        </p>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {result.email_sent ? `Confirmação enviada para ${result.email}.` : ""}
        </p>
      )}
      <Link href="/account" className="btn btn-primary" style={{ width: "100%" }}>
        Ver meus pedidos
      </Link>
      <button type="button" className="btn btn-outline" style={{ marginTop: "0.5rem", width: "100%" }} onClick={onClose}>
        Fechar
      </button>
    </>
  );
}

function PaymentInstructions({ result }: { result: CheckoutResult }) {
  const extra = result.payment_extra ?? {};
  const brCode = extra["br_code"];
  const qrImage = extra["qr_code_image"];
  const address = extra["address"];
  const network = extra["network"];
  const pixKey = extra["pix_key"];

  if (brCode || qrImage) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pague via PIX</h3>
        {qrImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImage} alt="QR Code PIX" style={{ display: "block", maxWidth: 220, margin: "0 auto 0.75rem", borderRadius: "0.5rem" }} />
        )}
        {brCode && (
          <>
            <label className="label">Código copia-e-cola</label>
            <textarea readOnly className="input" rows={3} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={brCode} />
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "0.5rem", width: "100%" }}
              onClick={() => navigator.clipboard.writeText(brCode).catch(() => undefined)}
            >
              Copiar código
            </button>
          </>
        )}
      </div>
    );
  }
  if (address) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
          Pague {result.settlement_amount} {result.settlement_currency}
          {network && <span style={{ color: "var(--muted)", fontWeight: "normal" }}> (rede {network})</span>}
        </h3>
        <label className="label">Carteira</label>
        <textarea readOnly className="input" rows={2} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={address} />
        {result.payment_url && (
          <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "0.5rem", width: "100%" }}>
            Abrir página de pagamento
          </a>
        )}
      </div>
    );
  }
  if (result.payment_url) {
    return (
      <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginBottom: "1rem", width: "100%" }}>
        Ir para a página de pagamento
      </a>
    );
  }
  if (pixKey) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pague via PIX</h3>
        <label className="label">Chave PIX</label>
        <input readOnly className="input" value={pixKey} />
      </div>
    );
  }
  return null;
}
