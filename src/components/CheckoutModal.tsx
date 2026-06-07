"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CheckoutResult, Currency, Plan, Platform, Profile, CreditAccount, CouponPreview, TaxRate } from "@/lib/api";
import { checkout, fetchCredits, fetchMyProfiles, fetchTaxRates, previewCoupon } from "@/lib/api";
import { getTracking } from "@/lib/tracking";
import { priceFor, formatBalance } from "@/lib/format";
import { getToken } from "@/lib/auth";
import { useApp } from "./Providers";
import { TrustSignals } from "./TrustSignals";
import { CustomDataFields, hasCustomFields, type CustomData } from "./CustomDataFields";
import type { CategoryCode } from "@/i18n/categories";
import type { LangCode } from "@/i18n/languages";

export function CheckoutModal({
  plan,
  lang = "en",
  onClose,
}: {
  plan: Plan;
  lang?: LangCode;
  onClose: () => void;
}) {
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
  // Snapshot dos campos extras por categoria (BMs, perfis, emails).
  // Passa por custom_data no /v1/checkout e cai no ticket pós-pagamento.
  const [customData, setCustomData] = useState<CustomData>({});
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  // VAT (Fase 5.3) — catálogo baixado on-mount + país do user (localStorage
  // OU best-effort via /api/geo). País não-EU → vatRate=0 e a linha some.
  // Cálculo final é autoritativo no server (CheckoutService + TaxService);
  // aqui é só pre-display pra evitar surpresa no botão "Confirm".
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [userCountry, setUserCountry] = useState<string>("");

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

  // VAT catalog + country detect. Best-effort: falha mantém vatRate=0
  // (preview transparente — server decide se cobra). Ordem: localStorage
  // (preferência manual) → /api/geo (cf-ipcountry/x-vercel-ip-country).
  useEffect(() => {
    fetchTaxRates().then(setTaxRates).catch(() => setTaxRates([]));
    let cancelled = false;
    const saved = typeof window !== "undefined" ? localStorage.getItem("viralefy_country") : null;
    if (saved) {
      setUserCountry(saved.toLowerCase());
      return;
    }
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const cc = (j?.data?.country ?? "") as string;
        if (cc) setUserCountry(cc.toLowerCase());
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  // Pre-display do VAT. amount líquido = price_cents − discount_cents
  // (cupom). rate_pct vem do catálogo público; país fora do catálogo cai
  // em rate 0 e a linha some. Round meio-cima espelha TaxService server-side.
  const vatRate = userCountry
    ? (taxRates.find((t) => t.country_code === userCountry)?.rate_pct ?? 0)
    : 0;
  const discountCents = couponPreview?.discount_usd_cents ?? 0;
  const netCents = Math.max(0, plan.price_cents - discountCents);
  const taxUsdCents = vatRate > 0 ? Math.round((netCents * vatRate) / 100) : 0;

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
        display_currency: currency?.code ?? "USD",
        payment_method: payMethod,
      };
      // Carrega o snapshot dos campos custom da categoria (BMs/perfis/emails)
      // — só inclui se houver dado, senão o objeto vazio polui o ticket.
      if (Object.keys(customData).length > 0) {
        payload.custom_data = customData;
      }
      // First-touch tracking (UTM/fbclid/gclid/referrer/landing_url +
      // browser context). Sempre vai — backend enriquece com IP+UA.
      const tracking = getTracking();
      if (Object.keys(tracking).length > 0) {
        payload.tracking = tracking;
      }
      // Cupom: só envia se passou no preview (backend revalida atomicamente).
      if (couponPreview) {
        payload.coupon_code = couponPreview.code;
      }
      // Country pra VAT (Fase 5.3) — server autoritativo, este envio
      // é apenas pra que o cálculo final bata com o pre-display.
      if (userCountry) {
        payload.country = userCountry;
      }
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
      setError(err instanceof Error ? err.message : "Checkout error");
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
          <CheckoutSuccess result={result} onClose={onClose} currency={currency} />
        ) : (
          <>
            <h2 style={{ marginBottom: "0.25rem" }}>Complete purchase</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              {platformIcon} {platformLabel} · {isProfile ? "delivered to the profile" : "delivered to the post"}
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>{plan.name}</strong> — {priceFor(plan, currency)}
            </p>
            <TrustSignals lang={lang} variant="compact" />

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div className="alert alert-error">{error}</div>}

              {!user && (
                <>
                  <div>
                    <label className="label" htmlFor="name">Full name</label>
                    <input className="input" id="name" name="name" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="email">Email</label>
                    <input className="input" id="email" name="email" type="email" required />
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
                    We&apos;ll create your account and send the password by email.
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

              {/* Campos custom por categoria (BMs/perfis/emails). Para as
                  outras categorias, hasCustomFields=false → não renderiza. */}
              {hasCustomFields(plan.category as CategoryCode) && (
                <CustomDataFields
                  category={plan.category as CategoryCode}
                  value={customData}
                  onChange={setCustomData}
                />
              )}

              {user && credit && (
                <PaymentMethodSection
                  credit={credit}
                  priceCents={plan.price_cents}
                  enough={enoughCredits}
                  payMethod={payMethod}
                  setPayMethod={setPayMethod}
                  currency={currency}
                />
              )}

              <div>
                <label className="label" htmlFor="coupon_code">Promo code (optional)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    className="input"
                    id="coupon_code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                    placeholder="BLACK10"
                    disabled={!!couponPreview}
                    style={{ flex: 1, textTransform: "uppercase" }}
                  />
                  {couponPreview ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => { setCouponPreview(null); setCouponCode(""); setCouponError(null); }}
                    >Remove</button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={!couponCode || couponChecking}
                      onClick={async () => {
                        setCouponChecking(true);
                        setCouponError(null);
                        try {
                          const p = await previewCoupon({
                            code: couponCode,
                            plan_id: plan.id,
                            email: user?.email,
                            display_currency: currency?.code,
                          });
                          setCouponPreview(p);
                        } catch (err) {
                          setCouponError(err instanceof Error ? err.message : "Invalid coupon");
                        } finally {
                          setCouponChecking(false);
                        }
                      }}
                    >{couponChecking ? "Checking…" : "Apply"}</button>
                  )}
                </div>
                {couponError && (
                  <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{couponError}</p>
                )}
                {couponPreview && (
                  <p style={{ color: "#3cd87d", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                    ✓ {couponPreview.code}: −${(couponPreview.discount_usd_cents / 100).toFixed(2)} off
                    {couponPreview.description && ` (${couponPreview.description})`}
                  </p>
                )}
              </div>

              {/* VAT pre-display (Fase 5.3). Server decide o cobrança final
                  via TaxService.ComputeTax; aqui é só preview pra UE/GB.
                  País fora do catálogo → vatRate=0 e o bloco some. */}
              {vatRate > 0 && (
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.85rem",
                    margin: 0,
                    paddingTop: "0.25rem",
                    borderTop: "1px dashed rgba(255,255,255,0.08)",
                  }}
                  aria-label="VAT estimate"
                >
                  VAT ({vatRate.toFixed(2)}%): +${(taxUsdCents / 100).toFixed(2)}
                </p>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Processing…" : payMethod === "credits" ? "Pay with credits" : "Confirm order"}
              </button>
            </form>
            <button type="button" className="btn btn-outline" style={{ marginTop: "1rem", width: "100%" }} onClick={onClose}>
              Cancel
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
        <label className="label" htmlFor="handle">{platformIcon} @ on {platformLabel}</label>
        <input className="input" id="handle" name="handle" placeholder="yourhandle" required />
      </div>
    );
  }
  return (
    <div>
      <label className="label">{platformIcon} {platformLabel} profile</label>
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
            + Add another profile
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input className="input" name="handle" placeholder="@ handle" required />
            <input className="input" name="display_name" placeholder="Nickname (optional)" />
          </div>
          {profiles && profiles.length > 0 && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.25rem 0" }} onClick={() => setUseNewProfile(false)}>
              ← Use existing profile
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
      ? "https://www.tiktok.com/@user/video/123…"
      : "https://www.instagram.com/p/ABC123/ or /reel/…";
  return (
    <div>
      <label className="label" htmlFor="publication_url">{platformIcon} Post URL ({platformLabel})</label>
      <input className="input" id="publication_url" name="publication_url" placeholder={placeholder} required />
      <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
        Paste the link to the post/video where the service will be applied.
      </p>
    </div>
  );
}

function PaymentMethodSection({
  credit, priceCents, enough, payMethod, setPayMethod, currency,
}: {
  credit: CreditAccount;
  priceCents: number;
  enough: boolean;
  payMethod: "gateway" | "credits";
  setPayMethod: (m: "gateway" | "credits") => void;
  currency: Currency | null;
}) {
  return (
    <div>
      <label className="label">Pay with</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <button type="button" className={payMethod === "gateway" ? "btn btn-primary" : "btn btn-outline"} onClick={() => setPayMethod("gateway")}>
          💳 External payment
        </button>
        <button
          type="button"
          className={payMethod === "credits" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => enough && setPayMethod("credits")}
          disabled={!enough}
          title={enough ? "" : "Insufficient balance"}
        >
          💎 Credits
        </button>
      </div>
      <p style={{ color: enough ? "var(--muted)" : "var(--danger)", fontSize: "0.78rem", marginTop: "0.4rem" }}>
        Balance: {formatBalance(credit.balance_cents, currency)}
        {!enough && ` — short by ${formatBalance(priceCents - credit.balance_cents, currency)}. `}
        {!enough && <Link href="/account/credits" style={{ color: "var(--accent)" }}>Top up</Link>}
      </p>
    </div>
  );
}

function CheckoutSuccess({ result, onClose, currency }: { result: CheckoutResult; onClose: () => void; currency: Currency | null }) {
  return (
    <>
      <h2 style={{ marginBottom: "0.75rem" }}>Order created! 🎉</h2>
      <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
        Order <strong>#{result.order_id.slice(0, 8)}</strong> for plan <strong>{result.plan_name}</strong>.
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <li>Amount: <strong>{result.display_symbol} {result.display_amount}</strong></li>
        {result.payment_method === "credits" ? (
          <>
            <li style={{ color: "var(--success)" }}>✓ Paid with credits</li>
            <li style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Remaining balance: {formatBalance(result.credit_balance_cents ?? 0, currency)}
            </li>
          </>
        ) : (
          <li>Charged in: <strong>{result.settlement_amount} {result.settlement_currency}</strong></li>
        )}
      </ul>

      {result.payment_method === "gateway" && <PaymentInstructions result={result} />}

      {result.account_created ? (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Account created for <strong>{result.email}</strong>. {result.email_sent ? "We've emailed your password and instructions." : "Email failed to send — open a ticket."}
        </p>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {result.email_sent ? `Confirmation sent to ${result.email}.` : ""}
        </p>
      )}
      <Link href="/account" className="btn btn-primary" style={{ width: "100%" }}>
        View my orders
      </Link>
      <button type="button" className="btn btn-outline" style={{ marginTop: "0.5rem", width: "100%" }} onClick={onClose}>
        Close
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
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pay with Pix</h3>
        {qrImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImage} alt="Pix QR code" style={{ display: "block", maxWidth: 220, margin: "0 auto 0.75rem", borderRadius: "0.5rem" }} />
        )}
        {brCode && (
          <>
            <label className="label">Copy-and-paste code</label>
            <textarea readOnly className="input" rows={3} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={brCode} />
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "0.5rem", width: "100%" }}
              onClick={() => navigator.clipboard.writeText(brCode).catch(() => undefined)}
            >
              Copy code
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
          Pay {result.settlement_amount} {result.settlement_currency}
          {network && <span style={{ color: "var(--muted)", fontWeight: "normal" }}> ({network} network)</span>}
        </h3>
        <label className="label">Wallet</label>
        <textarea readOnly className="input" rows={2} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={address} />
        {result.payment_url && (
          <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "0.5rem", width: "100%" }}>
            Open payment page
          </a>
        )}
      </div>
    );
  }
  if (result.payment_url) {
    return (
      <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginBottom: "1rem", width: "100%" }}>
        Go to payment page
      </a>
    );
  }
  if (pixKey) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pay with Pix</h3>
        <label className="label">Pix key</label>
        <input readOnly className="input" value={pixKey} />
      </div>
    );
  }
  return null;
}
