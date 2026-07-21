"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { tr, type LangCode, type Pack } from "@/i18n/languages";
import { localizedPlanName } from "@/lib/plan-labels";
import { Icon, type IconName } from "./Icon";

type CheckoutT = NonNullable<Pack["checkout"]>;

// Fluxo novo de checkout em 5 steps:
//   1. form        — preenche dados do pedido (nome, perfil, cupom...)
//   2. review      — BUG-69 do QA 2026-06-14: confirmação visual de
//                    handle/quantidade/total/método antes de avançar. Evita
//                    submit acidental de dados errados (handle digitado
//                    errado, quantidade trocada). ESC nesse step volta pro
//                    form em vez de fechar o modal pra preservar o snapshot.
//   3. method      — mostra todos os métodos de pagamento elegíveis com
//                    transparência de conversão (X em BRL → Y em USDT)
//   4. instructions — após criar o pedido com gateway_id escolhido, mostra
//                    QR/wallet/Stripe URL e área pra upload de comprovante
//   5. success     — confirma e linka pra "Meus pedidos"
//
// "credits" continua sendo método paralelo (pula direto pro step success
// porque não precisa de instruções externas).

type Step = "form" | "review" | "method" | "instructions" | "success";

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

  // BUG-29 do QA 2026-06-14: erro por campo (handle/email/etc) precisa ser
  // visualmente associado ao input — antes só existia o alerta genérico no
  // topo do form e o usuário não sabia onde olhar. Mapa por nome do campo:
  //   name, email, handle, publication_url
  // O setter clearFieldError é chamado no onChange/onInput pra limpar o
  // estado vermelho assim que o usuário começa a corrigir. Refs apontam pro
  // input do campo pra focar o primeiro com erro depois do submit falhar
  // (WCAG 3.3.1 — Error Identification).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  // Limpa o erro de um campo específico (usado no onChange dos inputs pra
  // remover o destaque vermelho assim que o usuário corrige). Mantém o
  // resto do mapa intacto pra não esconder outros erros pendentes.
  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // i18n com fallback inline — packs antigos não têm fieldError.
  const fe = tc.fieldError ?? {
    required: "This field is required.",
    nameInvalid: "Enter your full name.",
    emailInvalid: "Enter a valid email address.",
    handleInvalid: "Use letters, numbers, dot or underscore (1–30 chars). No spaces.",
    publicationUrlInvalid: "Paste a valid post or video URL.",
    formSummary: "Please fix the highlighted fields and try again.",
  };

  // Validação manual antes de avançar — não dá pra confiar só no `required`
  // / `pattern` do HTML porque queremos:
  //   1. mensagem específica por campo (não a bolha nativa do browser)
  //   2. destaque vermelho + aria-invalid persistente, não só ao tocar
  //   3. controle de foco pro primeiro campo invalido (a11y)
  const HANDLE_RE = /^@?[A-Za-z0-9._]{1,30}$/;
  // Regex de e-mail propositalmente permissiva — bloqueia gritante (sem @,
  // sem TLD, espaço) sem rejeitar endereços válidos exóticos.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Step 1 → Step 2 (review): valida campos básicos, captura snapshot.
  // BUG-69: NÃO avança direto pro method picker — mostra primeiro o resumo
  // pra confirmação visual.
  // BUG-29 do QA 2026-06-14: substituímos o HTML5 nativo por validação
  // controlada com mensagem por campo + foco no primeiro erro.
  function advanceToReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const snap = {
      name: String(fd.get("name") ?? user?.Name ?? "").trim(),
      email: String(fd.get("email") ?? user?.Email ?? "").trim(),
      handle: String(fd.get("handle") ?? "").trim(),
      display_name: String(fd.get("display_name") ?? "").trim(),
      publication_url: String(fd.get("publication_url") ?? "").trim(),
    };

    const errs: Record<string, string> = {};

    // name/email só são editáveis quando não tem user logado.
    if (!user) {
      if (!snap.name) errs.name = fe.required;
      else if (snap.name.length < 2) errs.name = fe.nameInvalid;
      if (!snap.email) errs.email = fe.required;
      else if (!EMAIL_RE.test(snap.email)) errs.email = fe.emailInvalid;
    }

    if (isProfile) {
      // Valida handle quando estamos criando um perfil novo (anônimo ou
      // logado com "+ Adicionar outro perfil"). Quando usa perfil
      // existente, o handle vem do select e não precisa validar.
      const needsHandle = !user || useNewProfile || !selectedProfileId;
      if (needsHandle) {
        if (!snap.handle) errs.handle = fe.required;
        else if (!HANDLE_RE.test(snap.handle)) errs.handle = fe.handleInvalid;
      }
    } else {
      if (!snap.publication_url) errs.publication_url = fe.required;
      else {
        try {
          // URL constructor aceita qualquer scheme — restringir a http(s).
          const u = new URL(snap.publication_url);
          if (u.protocol !== "http:" && u.protocol !== "https:") {
            errs.publication_url = fe.publicationUrlInvalid;
          }
        } catch {
          errs.publication_url = fe.publicationUrlInvalid;
        }
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(fe.formSummary);
      // Foca o primeiro campo com erro na ordem do form.
      const order = ["name", "email", "handle", "publication_url"];
      const first = order.find((k) => errs[k]);
      if (first) {
        // Próximo tick pra garantir que o React já aplicou aria-invalid.
        setTimeout(() => fieldRefs.current[first]?.focus(), 0);
      }
      return;
    }

    setFieldErrors({});
    setFormSnapshot(snap);
    setError(null);
    setStep("review");
  }

  // Step 2 (review) → Step 3 (method): após confirmação, busca métodos.
  // Pra crédito, pula method picker e cria o pedido direto.
  async function confirmReview() {
    if (!formSnapshot) return;
    if (payMethod === "credits") {
      await submitCheckout(formSnapshot, null);
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
      // BUG-29 (QA round 22): "invalid input" do backend era jogado solto
      // sem destacar o campo problemático nem traduzir. Agora tentamos
      // detectar shape estruturado (`{field, message}`) ou pattern do
      // texto pra mapear ao field específico — aí o usuário vê borda
      // vermelha + mensagem inline em vez de toast genérico em inglês.
      const raw = err instanceof Error ? err.message : "Checkout error";
      const lowered = raw.toLowerCase();
      const nextFieldErrors: Record<string, string> = {};
      // Heurísticas leves; matches strings comuns que o backend devolve
      // (`handle invalid`, `email format`, `publication url`).
      if (/handle|username|@/.test(lowered)) nextFieldErrors.handle = fe.handleInvalid;
      else if (/email|e-mail/.test(lowered)) nextFieldErrors.email = fe.emailInvalid;
      else if (/name|nome|nombre/.test(lowered)) nextFieldErrors.name = fe.nameInvalid;
      else if (/publication|url|link/.test(lowered)) nextFieldErrors.publication_url = fe.publicationUrlInvalid;
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setError(fe.formSummary);
      } else {
        setError(raw);
      }
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  // ESC fecha o modal em qualquer step (BUG-60 do QA 2026-06-12: no step
  // instructions o ESC era ignorado). WCAG 2.1.2 — provê uma forma de
  // sair do trap focal sem precisar do mouse no botão Close.
  //
  // BUG-69 do QA 2026-06-14: exceção pro step "review" — ESC volta pro
  // form em vez de fechar tudo. Se o usuário só quer revisar uma vez mais
  // o handle/quantidade, fechar e perder o snapshot seria hostil.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (step === "review") {
        setStep("form");
        return;
      }
      onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, step]);

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
          step === "review" ? () => setStep("form") :
          step === "method" ? () => setStep("review") :
          // BUG-62 do QA: step instructions sem botão de voltar — usuário
          // não conseguia trocar de método sem fechar tudo. Agora volta pro
          // method picker preservando os dados do form (snapshot já salvo).
          step === "instructions" ? () => setStep("method") :
          null
        } />
        <h2 style={{ marginBottom: "0.25rem" }}>
          {step === "form" && tc.completePurchase}
          {step === "review" && (tc.review?.title ?? "Review your order")}
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
            <form
              onSubmit={advanceToReview}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {error && <div className="alert alert-error" role="alert">{error}</div>}

              {!user && (
                <>
                  <div>
                    <label className="label" htmlFor="name">{tc.fullName}</label>
                    <input
                      className="input"
                      id="name"
                      name="name"
                      ref={(el) => { fieldRefs.current.name = el; }}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      onChange={() => clearFieldError("name")}
                    />
                    {fieldErrors.name && (
                      <p id="name-error" className="field-error" role="alert">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="email">{tc.email}</label>
                    <input
                      className="input"
                      id="email"
                      name="email"
                      type="email"
                      ref={(el) => { fieldRefs.current.email = el; }}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      onChange={() => clearFieldError("email")}
                    />
                    {fieldErrors.email && (
                      <p id="email-error" className="field-error" role="alert">{fieldErrors.email}</p>
                    )}
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
                  fieldError={fieldErrors.handle}
                  clearFieldError={() => clearFieldError("handle")}
                  handleRef={(el) => { fieldRefs.current.handle = el; }}
                />
              ) : (
                <PublicationSection
                  platform={plan.platform}
                  platformLabel={platformLabel}
                  platformIcon={platformIcon}
                  fieldError={fieldErrors.publication_url}
                  clearFieldError={() => clearFieldError("publication_url")}
                  inputRef={(el) => { fieldRefs.current.publication_url = el; }}
                />
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

        {step === "review" && formSnapshot && (
          <ReviewStep
            tc={tc}
            plan={plan}
            lang={lang}
            currency={currency}
            isProfile={isProfile}
            payMethod={payMethod}
            snapshot={formSnapshot}
            selectedProfileId={selectedProfileId}
            profiles={profiles}
            useNewProfile={useNewProfile}
            error={error}
            loading={loading}
            onConfirm={confirmReview}
            onBack={() => setStep("form")}
          />
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
            tc={tc}
          />
        )}

        {step === "instructions" && result && (
          <Instructions result={result} onDone={() => setStep("success")} tc={tc} />
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
    review: "2. Review",
    method: "3. Payment method",
    instructions: "4. Complete payment",
    success: "5. Done",
  };
  const order: Step[] = ["form", "review", "method", "instructions", "success"];
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
              color: i === currentIdx ? "var(--on-accent)" : i < currentIdx ? "#3cd87d" : "var(--muted)",
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

function ReviewStep({
  tc, plan, lang, currency, isProfile, payMethod, snapshot, selectedProfileId,
  profiles, useNewProfile, error, loading, onConfirm, onBack,
}: {
  tc: CheckoutT;
  plan: Plan;
  lang: LangCode;
  currency: Currency | null;
  isProfile: boolean;
  payMethod: "gateway" | "credits";
  snapshot: { name: string; email: string; handle: string; display_name: string; publication_url: string };
  selectedProfileId: string;
  profiles: Profile[] | null;
  useNewProfile: boolean;
  error: string | null;
  loading: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  // BUG-69: i18n com fallback inline porque review.* só foi traduzido em
  // en/pt/es por ora — outros idiomas caem no objeto en via tr() global,
  // mas mantemos `??` defensivo caso algum pack venha sem o subbloco.
  const r = tc.review ?? {
    title: "Review your order",
    handleLabel: "Recipient",
    totalLabel: "Total",
    confirmAndPay: "Confirm and pay",
    back: "← Back",
  };

  // Identifica o "recipient" pra exibição. Pra profile, mostra o handle
  // (existente ou novo). Pra post, mostra a URL.
  let recipientValue = "";
  if (isProfile) {
    if (profiles && !useNewProfile && selectedProfileId) {
      const p = profiles.find((x) => x.id === selectedProfileId);
      recipientValue = p ? `@${p.handle}${p.display_name ? ` — ${p.display_name}` : ""}` : "";
    } else {
      const h = snapshot.handle.replace(/^@/, "");
      recipientValue = h ? `@${h}` : "";
    }
  } else {
    recipientValue = snapshot.publication_url;
  }

  const methodLabel = payMethod === "credits"
    ? tc.payWithCredits
    : tc.continueChooseMethod;

  return (
    <div data-testid="checkout-review" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && <div className="alert alert-error">{error}</div>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <li style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span style={{ color: "var(--muted)" }}>{r.handleLabel}</span>
          <strong style={{ textAlign: "end", wordBreak: "break-all" }}>{recipientValue || "—"}</strong>
        </li>
        <li style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span style={{ color: "var(--muted)" }}>Plan</span>
          <strong style={{ textAlign: "end" }}>
            {localizedPlanName(plan, lang)}
          </strong>
        </li>
        <li style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span style={{ color: "var(--muted)" }}>{r.totalLabel}</span>
          <strong style={{ textAlign: "end" }} data-testid="checkout-review-total">
            {priceFor(plan, currency)}
          </strong>
        </li>
        <li style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span style={{ color: "var(--muted)" }}>Payment</span>
          <strong style={{ textAlign: "end" }}>{methodLabel}</strong>
        </li>
      </ul>
      <button
        type="button"
        data-testid="checkout-review-confirm"
        className="btn btn-primary"
        onClick={onConfirm}
        disabled={loading}
        style={{ width: "100%" }}
      >
        {loading ? tc.creatingOrder : r.confirmAndPay}
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={onBack}
        disabled={loading}
        style={{ width: "100%" }}
      >
        {r.back}
      </button>
    </div>
  );
}

function MethodPicker({
  methods, error, loading, selected, onSelect, onConfirm, onBack, tc,
}: {
  methods: PaymentMethodOption[] | null;
  error: string | null;
  loading: boolean;
  selected: PaymentMethodOption | null;
  onSelect: (m: PaymentMethodOption) => void;
  onConfirm: () => void;
  onBack: () => void;
  tc: CheckoutT;
}) {
  if (loading && !methods) {
    return <p style={{ color: "var(--muted)" }}>{tc.checking}</p>;
  }
  if (error) {
    return (
      <>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: "100%" }}>{tc.back}</button>
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
        <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: "100%" }}>{tc.back}</button>
      </>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
        {tc.pickHowYouPay}
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
        {loading
          ? tc.creatingOrder
          : selected
            // BUG-93 do QA 2026-06-12: o botão mostrava "Confirm — pay 13.53 BRL"
            // sem símbolo R$. Backend retorna charged_symbol (R$/€/£/$ ou
            // ₿/Ξ…); usamos no formato "Confirm — pay R$ 13,53" pra ficar
            // intuitivo no contexto BR.
            ? `${tc.confirmPay} ${selected.charged_symbol ?? ""} ${selected.charged_amount} ${selected.charged_currency}`.trim()
            : tc.pickAMethod}
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
        textAlign: "start",
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

function Instructions({ result, onDone, tc }: { result: CheckoutResult; onDone: () => void; tc: CheckoutT }) {
  // BUG-61 do QA 2026-06-12: Stripe / cartão NÃO precisa de comprovante —
  // o gateway confirma a captura automaticamente. Antes mostrava "Upload
  // your proof" mesmo em fluxo de cartão, confundindo o usuário. PIX/cripto
  // continuam mostrando porque exigem comprovante manual em alguns gateways.
  const extra = result.payment_extra ?? {};
  const isCard =
    extra["method_kind"] === "card" ||
    (result.gateway_provider ?? "").toLowerCase() === "stripe";
  return (
    <>
      <PaymentInstructions result={result} />
      {!isCard && <ProofUploadSection orderId={result.order_id} onUploaded={onDone} tc={tc} />}
      <button type="button" className="btn btn-outline" style={{ marginTop: "0.75rem", width: "100%" }} onClick={onDone}>
        {isCard ? "Done" : tc.skipUpload}
      </button>
    </>
  );
}

function ProofUploadSection({ orderId, onUploaded, tc }: { orderId: string; onUploaded: () => void; tc: CheckoutT }) {
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
        {tc.alreadyPaid}
      </h3>
      {err && <div className="alert alert-error" style={{ marginBottom: "0.5rem" }}>{err}</div>}
      <label className="label">{tc.receiptFile}</label>
      <input className="input" type="file" accept="image/*,application/pdf" onChange={onFile} disabled={busy} />
      {fileName && <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{fileName}</p>}
      <label className="label" style={{ marginTop: "0.5rem" }}>{tc.receiptNote}</label>
      <textarea
        className="input"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        // BUG-98 do QA 2026-06-12: placeholder antigo mostrava hash hex
        // (0x1234abcd) num campo de comprovante PIX, confundindo o
        // usuário BR. Agora deixamos placeholder vazio.
        placeholder=""
      />
      {busy && <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{tc.checking}</p>}
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
  fieldError, clearFieldError, handleRef,
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
  // BUG-29: erro/ref por campo vêm de cima pra integrar com a validação
  // controlada do form (substituindo o pattern/required do HTML5).
  fieldError?: string;
  clearFieldError: () => void;
  handleRef: (el: HTMLInputElement | null) => void;
}) {
  if (!user) {
    return (
      <div>
        <label className="label" htmlFor="handle">{platformIcon} @ on {platformLabel}</label>
        <input
          className="input"
          id="handle"
          name="handle"
          placeholder="yourhandle"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          ref={handleRef}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "handle-error" : undefined}
          onChange={clearFieldError}
        />
        {fieldError && (
          <p id="handle-error" className="field-error" role="alert">{fieldError}</p>
        )}
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
              id="handle"
              name="handle"
              placeholder="@ handle"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              ref={handleRef}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "handle-error" : undefined}
              onChange={clearFieldError}
            />
            <input className="input" name="display_name" placeholder="Nickname (optional)" />
          </div>
          {fieldError && (
            <p id="handle-error" className="field-error" role="alert">{fieldError}</p>
          )}
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

function PublicationSection({
  platform, platformLabel, platformIcon, fieldError, clearFieldError, inputRef,
}: {
  platform: Platform;
  platformLabel: string;
  platformIcon: ReactNode;
  fieldError?: string;
  clearFieldError: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const placeholder =
    platform === "tiktok"
      ? "https://www.tiktok.com/@user/video/123…"
      : "https://www.instagram.com/p/ABC123/ or /reel/…";
  return (
    <div>
      <label className="label" htmlFor="publication_url">{platformIcon} Post URL ({platformLabel})</label>
      <input
        className="input"
        id="publication_url"
        name="publication_url"
        placeholder={placeholder}
        ref={inputRef}
        aria-invalid={!!fieldError}
        aria-describedby={fieldError ? "publication_url-error" : "publication_url-help"}
        onChange={clearFieldError}
      />
      {fieldError ? (
        <p id="publication_url-error" className="field-error" role="alert">{fieldError}</p>
      ) : (
        <p id="publication_url-help" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
          Paste the link to the post/video where the service will be applied.
        </p>
      )}
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
//
// BUG-91 do QA 2026-06-12: PIX checkout não exibia QR / chave Pix. A
// causa era o provider mudou pra AbacatePay (key "abacatepay") e o front
// continuava só aceitando "manual_pix" e "woovi", então o branch de UI
// de PIX nunca era entrado e o usuário caía direto no upload de
// comprovante sem nenhuma instrução de pagamento.
const PIX_PROVIDERS = new Set(["manual_pix", "woovi", "abacatepay"]);

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
