"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type {
  CheckoutResult,
  Currency,
  Plan,
  Platform,
  Profile,
  CreditAccount,
  CouponPreview,
  TaxRate,
  PaymentMethodOption,
} from "@/lib/api";
import {
  checkout,
  fetchCredits,
  fetchMyProfiles,
  fetchPaymentMethods,
  fetchTaxRates,
  previewCoupon,
  uploadOrderProof,
  uploadOrderProofMultipart,
} from "@/lib/api";
import { getTracking } from "@/lib/tracking";
import { priceFor, formatBalance } from "@/lib/format";
import { getToken } from "@/lib/auth";
import { useApp } from "./Providers";
import { TrustSignals } from "./TrustSignals";
import { CustomDataFields, hasCustomFields, type CustomData } from "./CustomDataFields";
import type { CategoryCode } from "@/i18n/categories";
import { tr, type LangCode } from "@/i18n/languages";
import { localizedPlanName } from "@/lib/plan-labels";
import { Icon, type IconName } from "./Icon";

// Fluxo novo de checkout em 4 steps:
//   1. form        — preenche dados do pedido (nome, perfil, cupom...)
//   2. method      — mostra todos os métodos de pagamento elegíveis com
//                    transparência de conversão (X em BRL → Y em USDT)
//   3. instructions — após criar o pedido com gateway_id escolhido, mostra
//                    QR/wallet/Stripe URL e área pra upload de comprovante
//   4. success     — confirma e linka pra "Meus pedidos"
//
// "credits" continua sendo método paralelo (pula direto pro step success
// porque não precisa de instruções externas).

type Step = "form" | "method" | "instructions" | "success";

export function CheckoutModal({
  plan,
  lang = "en",
  onClose,
  targetCountry,
}: {
  plan: Plan;
  lang?: LangCode;
  onClose: () => void;
  targetCountry?: string;
}) {
  const { currency, user } = useApp();
  const t = tr(lang);
  // checkout-section vem do bloco i18n. Nunca undefined porque tr() faz
  // fallback pra en quando o idioma não tem cópia própria.
  const tc = t.checkout!;
  const isProfile = plan.target_type === "profile";
  const platformLabel = plan.platform === "tiktok" ? "TikTok" : "Instagram";
  const platformIconName: IconName = plan.platform === "tiktok" ? "tiktok" : "instagram";
  const platformIcon = <Icon name={platformIconName} size={16} />;

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [credit, setCredit] = useState<CreditAccount | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [useNewProfile, setUseNewProfile] = useState(false);
  const [payMethod, setPayMethod] = useState<"gateway" | "credits">("gateway");
  const [customData, setCustomData] = useState<CustomData>({});
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  // Snapshot dos dados do step 1 — guardamos pra reaproveitar quando o
  // usuário escolhe um método de pagamento e o form é submetido de novo
  // no step 2 (a chamada de checkout acontece DEPOIS da escolha do método).
  const [formSnapshot, setFormSnapshot] = useState<{
    name: string;
    email: string;
    handle: string;
    display_name: string;
    publication_url: string;
  } | null>(null);

  // Methods + escolha
  const [methods, setMethods] = useState<PaymentMethodOption[] | null>(null);
  const [methodsError, setMethodsError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption | null>(null);

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

  const vatRate = userCountry
    ? (taxRates.find((t) => t.country_code === userCountry)?.rate_pct ?? 0)
    : 0;
  const discountCents = couponPreview?.discount_usd_cents ?? 0;
  const netCents = Math.max(0, plan.price_cents - discountCents);
  const taxUsdCents = vatRate > 0 ? Math.round((netCents * vatRate) / 100) : 0;
  const enoughCredits = credit ? credit.balance_cents >= plan.price_cents : false;

  // Step 1 → Step 2: valida campos básicos, captura snapshot, busca métodos
  async function advanceToMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const snap = {
      name: String(fd.get("name") ?? user?.Name ?? ""),
      email: String(fd.get("email") ?? user?.Email ?? ""),
      handle: String(fd.get("handle") ?? ""),
      display_name: String(fd.get("display_name") ?? ""),
      publication_url: String(fd.get("publication_url") ?? ""),
    };
    setFormSnapshot(snap);
    if (payMethod === "credits") {
      await submitCheckout(snap, null);
      return;
    }
    setMethodsError(null);
    setSelectedMethod(null);
    setStep("method");
    setLoading(true);
    try {
      const list = await fetchPaymentMethods(plan.id, currency?.code, userCountry);
      setMethods(list);
      // NÃO pre-selecionamos mesmo com 1 opção — cliente precisa ver
      // os termos (network warning, conversão) e clicar deliberadamente.
      // Pular estágio camufla decisões caras (rede crypto errada = perda).
    } catch (err) {
      setMethodsError(err instanceof Error ? err.message : "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 → cria pedido com gateway_id escolhido
  async function confirmSelectedMethod() {
    if (!selectedMethod || !formSnapshot) return;
    await submitCheckout(formSnapshot, selectedMethod);
  }

  async function submitCheckout(
    snap: NonNullable<typeof formSnapshot>,
    method: PaymentMethodOption | null,
  ) {
    setLoading(true);
    setError(null);
    const token = getToken() ?? undefined;
    try {
      const payload: Parameters<typeof checkout>[0] = {
        plan_id: plan.id,
        email: snap.email,
        name: snap.name,
        display_currency: currency?.code ?? "USD",
        payment_method: payMethod,
      };
      if (method) {
        payload.gateway_id = method.gateway_id;
        // Quando o gateway é multi-currency (Heleket/Stripe), o card escolhido
        // carrega a moeda específica de pay-in. Server usa pra criar invoice
        // na moeda certa (BTC, ETH, USDT...) em vez do settlement canonical.
        payload.pay_currency = method.charged_currency;
      }
      if (Object.keys(customData).length > 0) payload.custom_data = customData;
      const tracking = getTracking();
      if (Object.keys(tracking).length > 0) payload.tracking = tracking;
      if (couponPreview) payload.coupon_code = couponPreview.code;
      if (userCountry) payload.country = userCountry;
      if (targetCountry) payload.target_country = targetCountry;
      if (isProfile) {
        if (user && profiles && !useNewProfile && selectedProfileId) {
          payload.profile_id = selectedProfileId;
        } else {
          payload.new_profile = {
            platform: plan.platform as Platform,
            handle: snap.handle,
            display_name: snap.display_name || undefined,
          };
        }
      } else {
        payload.publication_url = snap.publication_url;
      }
      const res = await checkout(payload, token);
      setResult(res);
      setStep(payMethod === "credits" ? "success" : "instructions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout error");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="checkout-modal"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <StepHeader step={step} onBack={
          step === "method" ? () => setStep("form") :
          step === "instructions" ? null :
          null
        } />
        <h2 style={{ marginBottom: "0.25rem" }}>
          {step === "form" && tc.completePurchase}
          {step === "method" && tc.choosePaymentMethod}
          {step === "instructions" && tc.completePayment}
          {step === "success" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <Icon name="celebrate" size={22} color="var(--accent, #00fed6)" />
              Order created!
            </span>
          )}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
          {platformIcon} {platformLabel} · {isProfile ? "delivered to the profile" : "delivered to the post"}
        </p>
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>{localizedPlanName(plan, lang)}</strong> — {priceFor(plan, currency)}
        </p>

        {step === "form" && (
          <>
            <TrustSignals lang={lang} variant="compact" />
            <form onSubmit={advanceToMethod} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div className="alert alert-error">{error}</div>}

              {!user && (
                <>
                  <div>
                    <label className="label" htmlFor="name">{tc.fullName}</label>
                    <input className="input" id="name" name="name" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="email">{tc.email}</label>
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

              <CouponInput
                code={couponCode}
                setCode={setCouponCode}
                preview={couponPreview}
                setPreview={setCouponPreview}
                error={couponError}
                setError={setCouponError}
                checking={couponChecking}
                setChecking={setCouponChecking}
                planId={plan.id}
                userEmail={user?.Email}
                currencyCode={currency?.code}
              />

              {vatRate > 0 && (
                <p
                  style={{
                    color: "var(--muted)", fontSize: "0.85rem", margin: 0,
                    paddingTop: "0.25rem", borderTop: "1px dashed rgba(255,255,255,0.08)",
                  }}
                  aria-label="VAT estimate"
                >
                  VAT ({vatRate.toFixed(2)}%): +${(taxUsdCents / 100).toFixed(2)}
                </p>
              )}

              <button type="submit" data-testid="checkout-submit" className="btn btn-primary" disabled={loading}>
                {loading ? tc.creatingOrder :
                  payMethod === "credits" ? tc.payWithCredits : tc.continueChooseMethod}
              </button>
            </form>
            <button type="button" className="btn btn-outline" style={{ marginTop: "1rem", width: "100%" }} onClick={onClose}>
              {tc.cancel}
            </button>
          </>
        )}

        {step === "method" && (
          <MethodPicker
            methods={methods}
            error={methodsError}
            loading={loading}
            selected={selectedMethod}
            onSelect={setSelectedMethod}
            onConfirm={confirmSelectedMethod}
            onBack={() => setStep("form")}
          />
        )}

        {step === "instructions" && result && (
          <Instructions result={result} onDone={() => setStep("success")} />
        )}

        {step === "success" && result && (
          <CheckoutSuccess result={result} onClose={onClose} currency={currency} />
        )}
      </div>
    </div>
  );
}

function StepHeader({ step, onBack }: { step: Step; onBack: (() => void) | null }) {
  const labels: Record<Step, string> = {
    form: "1. Details",
    method: "2. Payment method",
    instructions: "3. Complete payment",
    success: "4. Done",
  };
  const order: Step[] = ["form", "method", "instructions", "success"];
  const currentIdx = order.indexOf(step);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {order.map((s, i) => (
          <span
            key={s}
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.5rem",
              borderRadius: 999,
              background: i === currentIdx ? "var(--accent)" : i < currentIdx ? "rgba(60,216,125,0.18)" : "rgba(255,255,255,0.06)",
              color: i === currentIdx ? "#000" : i < currentIdx ? "#3cd87d" : "var(--muted)",
              fontWeight: i === currentIdx ? 600 : 400,
            }}
          >
            {labels[s]}
          </span>
        ))}
      </div>
      {onBack && (
        <button type="button" onClick={onBack} className="btn btn-ghost" style={{ padding: "0.1rem 0.5rem", fontSize: "0.75rem" }}>
          ← Back
        </button>
      )}
    </div>
  );
}

function MethodPicker({
  methods, error, loading, selected, onSelect, onConfirm, onBack,
}: {
  methods: PaymentMethodOption[] | null;
  error: string | null;
  loading: boolean;
  selected: PaymentMethodOption | null;
  onSelect: (m: PaymentMethodOption) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  if (loading && !methods) {
    return <p style={{ color: "var(--muted)" }}>Loading payment options…</p>;
  }
  if (error) {
    return (
      <>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: "100%" }}>← Back</button>
      </>
    );
  }
  if (!methods || methods.length === 0) {
    return (
      <>
        <div
          style={{
            background: "rgba(255, 76, 76, 0.10)",
            border: "1px solid rgba(255, 76, 76, 0.45)",
            color: "#ff8a8a",
            padding: "0.85rem",
            borderRadius: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <strong>No payment methods available for your region/currency.</strong>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>
            We don&apos;t currently support a payment method for your country and selected display currency. Switch to USD/USDT in the top-right currency picker, or contact support.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: "100%" }}>← Back</button>
      </>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
        Pick how you want to pay. The amount in your chosen method is shown below.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {methods.map((m) => (
          <MethodCard
            key={m.gateway_id}
            method={m}
            active={selected?.gateway_id === m.gateway_id}
            onSelect={() => onSelect(m)}
          />
        ))}
      </div>
      <button
        type="button"
        data-testid="checkout-confirm"
        className="btn btn-primary"
        disabled={!selected || loading}
        onClick={onConfirm}
        style={{ width: "100%" }}
      >
        {loading ? "Creating order…" : selected ? `Confirm — pay ${selected.charged_amount} ${selected.charged_currency}` : "Pick a method first"}
      </button>
    </div>
  );
}

function MethodCard({
  method, active, onSelect,
}: {
  method: PaymentMethodOption;
  active: boolean;
  onSelect: () => void;
}) {
  const iconName: IconName =
    method.kind === "card" ? "card" :
    method.kind === "pix" ? "money" :
    method.kind === "crypto_manual" ? "crypto" :
    method.kind === "crypto_auto" ? "bolt" : "money";
  const subtitle =
    method.kind === "card" ? "Credit/debit card via Stripe" :
    method.kind === "pix" ? "Instant Brazilian transfer" :
    method.kind === "crypto_manual" ? (method.network_label || "Crypto wallet") :
    method.kind === "crypto_auto" ? "Crypto, auto-confirmed on chain" :
    "Other";
  return (
    <button
      type="button"
      data-testid="payment-method-card"
      data-method-id={method.gateway_id}
      data-method-kind={method.kind}
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: "0.85rem",
        borderRadius: "0.6rem",
        border: active ? "2px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "rgba(60,216,125,0.06)" : "transparent",
        color: "inherit",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Icon name={iconName} size={16} color="var(--accent, #00fed6)" />
          {method.kind === "pix" ? <span>PIX · {method.name}</span> : method.name}
        </strong>
        <span style={{ fontWeight: 700 }}>
          {method.charged_symbol} {method.charged_amount} {method.charged_currency}
        </span>
      </div>
      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{subtitle}</span>
      {method.conversion_note && (
        <span style={{ fontSize: "0.75rem", color: "#7cc4ff" }}>
          ℹ {method.conversion_note}
        </span>
      )}
      {method.network_warning && (
        <span style={{ fontSize: "0.75rem", color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <Icon name="warning" size={12} />
          {method.network_warning}
        </span>
      )}
    </button>
  );
}

function Instructions({ result, onDone }: { result: CheckoutResult; onDone: () => void }) {
  return (
    <>
      <PaymentInstructions result={result} />
      <ProofUploadSection orderId={result.order_id} onUploaded={onDone} />
      <button type="button" className="btn btn-outline" style={{ marginTop: "0.75rem", width: "100%" }} onClick={onDone}>
        Skip — I&apos;ll upload later
      </button>
    </>
  );
}

function ProofUploadSection({ orderId, onUploaded }: { orderId: string; onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    // Multipart limita 5MB no server; base64 fallback 800KB. Validamos cedo
    // pra mensagem clara em vez de 413 cru.
    if (f.size > 5 * 1024 * 1024) {
      setErr("File too large — max 5 MB. Use a compressed screenshot.");
      return;
    }
    setErr(null);
    setBusy(true);
    const token = getToken();
    if (!token) {
      setErr("You need to be logged in to upload proof. Please log in and try again.");
      setBusy(false);
      return;
    }
    try {
      // Multipart é o caminho preferido — backend faz PutObject no MinIO/R2.
      await uploadOrderProofMultipart(token, orderId, f, note);
      onUploaded();
      return;
    } catch (er) {
      const msg = er instanceof Error ? er.message : "Upload failed";
      // Storage disabled (503) → cai no fluxo legacy base64. Limite 800KB.
      const isStorageDisabled = /storage|503|not configured/i.test(msg);
      if (!isStorageDisabled || f.size > 800 * 1024) {
        setErr(msg);
        setBusy(false);
        return;
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error("Read failed"));
          r.readAsDataURL(f);
        });
        await uploadOrderProof(token, orderId, {
          file_url: dataUrl,
          file_name: f.name,
          mime_type: f.type,
          size_bytes: f.size,
          note: note || undefined,
        });
        onUploaded();
      } catch (er2) {
        setErr(er2 instanceof Error ? er2.message : "Upload failed (fallback)");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "1rem",
        marginTop: "1rem",
      }}
    >
      <h3 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>
        Already paid? Upload your proof
      </h3>
      <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
        Send a screenshot of your PIX receipt or your crypto transaction hash. We&apos;ll activate the order once we confirm the deposit.
      </p>
      {err && <div className="alert alert-error" style={{ marginBottom: "0.5rem" }}>{err}</div>}
      <label className="label">Receipt file (image or PDF, max 5 MB)</label>
      <input className="input" type="file" accept="image/*,application/pdf" onChange={onFile} disabled={busy} />
      {fileName && <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Selected: {fileName}</p>}
      <label className="label" style={{ marginTop: "0.5rem" }}>Note (TX hash, time, etc.)</label>
      <textarea
        className="input"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ex.: 0x1234abcd… at 14:32 BRT"
      />
      {busy && <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Uploading…</p>}
    </div>
  );
}

function CouponInput({
  code, setCode, preview, setPreview, error, setError, checking, setChecking,
  planId, userEmail, currencyCode,
}: {
  code: string;
  setCode: (s: string) => void;
  preview: CouponPreview | null;
  setPreview: (p: CouponPreview | null) => void;
  error: string | null;
  setError: (e: string | null) => void;
  checking: boolean;
  setChecking: (b: boolean) => void;
  planId: string;
  userEmail?: string;
  currencyCode?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor="coupon_code">Promo code (optional)</label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          className="input"
          id="coupon_code"
          data-testid="coupon-input"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          placeholder="BLACK10"
          disabled={!!preview}
          style={{ flex: 1, textTransform: "uppercase" }}
        />
        {preview ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => { setPreview(null); setCode(""); setError(null); }}
          >Remove</button>
        ) : (
          <button
            type="button"
            className="btn btn-outline"
            disabled={!code || checking}
            onClick={async () => {
              setChecking(true);
              setError(null);
              try {
                const p = await previewCoupon({
                  code, plan_id: planId, email: userEmail, display_currency: currencyCode,
                });
                setPreview(p);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Invalid coupon");
              } finally {
                setChecking(false);
              }
            }}
          >{checking ? "Checking…" : "Apply"}</button>
        )}
      </div>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{error}</p>
      )}
      {preview && (
        <p style={{ color: "#3cd87d", fontSize: "0.85rem", marginTop: "0.3rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Icon name="check" size={14} />
          {preview.code}: −${(preview.discount_usd_cents / 100).toFixed(2)} off
          {preview.description && ` (${preview.description})`}
        </p>
      )}
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
  platformIcon: ReactNode;
  selectedProfileId: string;
  setSelectedProfileId: (s: string) => void;
  useNewProfile: boolean;
  setUseNewProfile: (b: boolean) => void;
}) {
  // BUG-16 do QA 2026-06-12: handle Instagram aceitava "usuario invalido!"
  // até passar pra step de pagamento. Validamos client-side: letras, números,
  // underscore e ponto, 1-30 chars. TikTok permite a mesma faixa. Permite
  // @ opcional no início pra UX.
  const HANDLE_PATTERN = "^@?[A-Za-z0-9._]{1,30}$";
  if (!user) {
    return (
      <div>
        <label className="label" htmlFor="handle">{platformIcon} @ on {platformLabel}</label>
        <input
          className="input"
          id="handle"
          name="handle"
          placeholder="yourhandle"
          pattern={HANDLE_PATTERN}
          title="Letters, numbers, dot and underscore. No spaces or special chars."
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
        />
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
            <input
              className="input"
              name="handle"
              placeholder="@ handle"
              pattern={HANDLE_PATTERN}
              title="Letters, numbers, dot and underscore. No spaces or special chars."
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
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

function PublicationSection({ platform, platformLabel, platformIcon }: { platform: Platform; platformLabel: string; platformIcon: ReactNode }) {
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
        <button
          type="button"
          className={payMethod === "gateway" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => setPayMethod("gateway")}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
        >
          <Icon name="card" size={16} />
          External payment
        </button>
        <button
          type="button"
          className={payMethod === "credits" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => enough && setPayMethod("credits")}
          disabled={!enough}
          title={enough ? "" : "Insufficient balance"}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
        >
          <Icon name="diamond" size={16} />
          Credits
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
      <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
        Order <strong>#{result.order_id.slice(0, 8)}</strong> for plan <strong>{result.plan_name}</strong>.
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <li>Amount: <strong>{result.display_symbol} {result.display_amount}</strong></li>
        {result.payment_method === "credits" ? (
          <>
            <li style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Icon name="check" size={14} />
              Paid with credits
            </li>
            <li style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Remaining balance: {formatBalance(result.credit_balance_cents ?? 0, currency)}
            </li>
          </>
        ) : (
          <li>Charged in: <strong>{result.settlement_amount} {result.settlement_currency}</strong></li>
        )}
      </ul>
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

// PIX_PROVIDERS — providers que efetivamente cobram via PIX. Guard
// defensivo no client: mesmo que payment_extra venha com pix_key/br_code
// por configuração errada do gateway, NÃO renderiza UI de PIX se o
// provider não for um dos abaixo. Cliente internacional não deve ver
// PIX em hipótese alguma; backend já bloqueia, mas defesa em profundidade.
const PIX_PROVIDERS = new Set(["manual_pix", "woovi"]);

function PaymentInstructions({ result }: { result: CheckoutResult }) {
  const extra = result.payment_extra ?? {};
  const provider = (result.gateway_provider ?? "").toLowerCase();
  const isPixRail = PIX_PROVIDERS.has(provider);
  const brCode = isPixRail ? extra["br_code"] : undefined;
  const qrImage = isPixRail ? extra["qr_code_image"] : undefined;
  const pixKey = isPixRail ? extra["pix_key"] : undefined;
  const address = extra["address"];
  const network = extra["network"];
  const networkWarning = extra["network_warning"];
  const networkLabel = extra["network_label"];
  const walletAddress = extra["wallet_address"];
  const memo = extra["memo"];
  const memoWarning = extra["memo_warning"];
  const methodKind = extra["method_kind"];

  // Stripe / cartão — payment_url é a sessão hospedada
  if (methodKind === "card" || (result.gateway_provider === "stripe" && result.payment_url)) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pay with card</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          You&apos;ll be redirected to Stripe to enter your card details.
        </p>
        <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "100%" }}>
          Open Stripe checkout →
        </a>
      </div>
    );
  }

  if (brCode || qrImage) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pay with Pix</h3>
        {result.settlement_currency !== result.display_currency && (
          <p style={{ fontSize: "0.8rem", color: "#7cc4ff", marginBottom: "0.5rem" }}>
            ℹ You pay {result.display_symbol} {result.display_amount} {result.display_currency} via PIX. The platform converts to {result.settlement_amount} {result.settlement_currency} on receipt.
          </p>
        )}
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

  if (pixKey) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pay with Pix</h3>
        {result.settlement_currency !== result.display_currency && (
          <p style={{ fontSize: "0.8rem", color: "#7cc4ff", marginBottom: "0.5rem" }}>
            ℹ You pay {result.display_symbol} {result.display_amount} {result.display_currency} via PIX. The platform converts to {result.settlement_amount} {result.settlement_currency} on receipt.
          </p>
        )}
        <label className="label">Pix key</label>
        <input readOnly className="input" value={pixKey} />
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: "0.5rem", width: "100%" }}
          onClick={() => navigator.clipboard.writeText(pixKey).catch(() => undefined)}
        >
          Copy key
        </button>
      </div>
    );
  }

  // Crypto manual / auto — wallet_address ou address
  const wallet = walletAddress || address;
  if (wallet) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
          Pay {result.settlement_amount} {result.settlement_currency}
          {(networkLabel || network) && (
            <span style={{ color: "var(--muted)", fontWeight: "normal" }}> · {networkLabel || network}</span>
          )}
        </h3>
        <div
          style={{
            background: "rgba(255, 76, 76, 0.12)",
            border: "1px solid rgba(255, 76, 76, 0.45)",
            color: "#ff8a8a",
            padding: "0.65rem 0.75rem",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
            marginBottom: "0.75rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <Icon name="warning" size={16} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
          <span>{networkWarning || `Send ONLY on the ${network || "shown"} network. Deposits on any other network will be lost forever.`}</span>
        </div>
        <label className="label">Wallet address</label>
        <textarea readOnly className="input" rows={2} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={wallet} />
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: "0.5rem", width: "100%" }}
          onClick={() => navigator.clipboard.writeText(wallet).catch(() => undefined)}
        >
          Copy address
        </button>
        {memo && (
          <div style={{ marginTop: "0.75rem" }}>
            <label className="label">Memo / tag (required)</label>
            <input readOnly className="input" style={{ fontFamily: "monospace" }} value={memo} />
            {memoWarning && (
              <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Icon name="warning" size={12} />
                {memoWarning}
              </p>
            )}
          </div>
        )}
        {result.payment_url && (
          <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "0.5rem", width: "100%" }}>
            Open payment page
          </a>
        )}
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
          Your order will be activated within 1 hour after the deposit is confirmed on chain. Upload the transaction hash or receipt below to speed up review.
        </p>
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
  return null;
}
