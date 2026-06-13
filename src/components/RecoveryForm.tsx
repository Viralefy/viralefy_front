"use client";

import { useState } from "react";
import { useApp } from "./Providers";
import { Turnstile } from "./Turnstile";
import { getTracking } from "@/lib/tracking";
import type { LangCode } from "@/i18n/languages";

// Formulário do Account Recovery por país. Coleta:
//   - handle do perfil banido (@) + plataforma
//   - data do banimento (YYYY-MM-DD)
//   - motivo estimado
//   - URL da última publicação visível
//   - descrição extra
//   - contato (e-mail + nome)
//
// Submit chama POST /v1/recovery-request. Backend valida Turnstile, cria
// order pending no plano "Account recovery" e devolve payment_url. Após
// pagamento confirmado, ticket é aberto automaticamente com o snapshot
// completo do form.

type FormState = {
  handle: string;
  platform: "instagram" | "tiktok";
  banDate: string;
  estimatedReason: string;
  lastPublicationURL: string;
  description: string;
  contactEmail: string;
  contactName: string;
};

const EMPTY: FormState = {
  handle: "",
  platform: "instagram",
  banDate: "",
  estimatedReason: "",
  lastPublicationURL: "",
  description: "",
  contactEmail: "",
  contactName: "",
};

// BUG-97 do QA 2026-06-12: o botão de submit do RecoveryForm tinha o preço
// $10.000 hardcoded por idioma com símbolo errado em PT/ES (mostrava "$"
// em vez de "R$" ou "MX$" mesmo com BRL/MXN selecionado). Agora derivamos
// o label do botão a partir da moeda atual.
const RECOVERY_USD_PRICE = 10000;

function recoveryPriceLabel(symbol: string, rate: number, lang: LangCode): string {
  const amount = RECOVERY_USD_PRICE * (rate || 1);
  // Locale por LangCode pra formatação numérica adequada.
  const loc = lang === "pt" ? "pt-BR"
    : lang === "es" || lang === "es_AR" ? "es"
    : lang === "fr" ? "fr"
    : lang === "de" ? "de"
    : lang === "it" ? "it"
    : lang === "ru" ? "ru"
    : "en-US";
  try {
    return `${symbol} ${new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(amount)}`;
  } catch {
    return `${symbol} ${amount.toFixed(2)}`;
  }
}

const COPY: Record<string, Record<string, string>> = {
  en: {
    title: "Account recovery request",
    intro: "Tell us what happened. We negotiate directly with the platform team — it usually takes 7–21 days. Pay only on success guarantee terms (refund if not recovered in 30 days).",
    handle: "Public handle (@)",
    handlePh: "@username",
    platform: "Platform",
    banDate: "Ban / restriction date",
    estimatedReason: "Estimated reason",
    estimatedReasonPh: "e.g. mass reporting, age verification fail, copyright strike…",
    lastPublication: "Last visible publication URL",
    lastPublicationPh: "https://instagram.com/p/…",
    description: "What happened (detailed)",
    descriptionPh: "Free text. Anything that helps us understand the case.",
    email: "Contact email",
    name: "Your name",
    submitPrefix: "Continue to payment",
    sending: "Submitting…",
    success: "Order created. Redirecting to payment…",
    error: "Could not submit. Please retry.",
  },
  pt: {
    title: "Pedido de recuperação de perfil",
    intro: "Conte o que aconteceu. Negociamos direto com o time da plataforma — leva 7–21 dias em média. Pagamento na garantia: reembolso se não recuperarmos em 30 dias.",
    handle: "@ do perfil",
    handlePh: "@username",
    platform: "Plataforma",
    banDate: "Data do banimento / restrição",
    estimatedReason: "Motivo estimado",
    estimatedReasonPh: "ex: denúncia em massa, verificação de idade, strike de direitos autorais…",
    lastPublication: "URL da última publicação visível",
    lastPublicationPh: "https://instagram.com/p/…",
    description: "Conte os detalhes",
    descriptionPh: "Texto livre. Qualquer coisa que ajude a entender o caso.",
    email: "E-mail de contato",
    name: "Seu nome",
    submitPrefix: "Continuar para pagamento",
    sending: "Enviando…",
    success: "Pedido criado. Redirecionando para o pagamento…",
    error: "Não conseguimos enviar. Tente novamente.",
  },
  es: {
    title: "Solicitud de recuperación de cuenta",
    intro: "Cuéntanos qué pasó. Negociamos directamente con la plataforma — toma 7–21 días en promedio. Garantía: reembolso si no recuperamos en 30 días.",
    handle: "@ del perfil",
    handlePh: "@usuario",
    platform: "Plataforma",
    banDate: "Fecha del baneo / restricción",
    estimatedReason: "Motivo estimado",
    estimatedReasonPh: "ej: denuncias masivas, verificación de edad, strike de copyright…",
    lastPublication: "URL de la última publicación visible",
    lastPublicationPh: "https://instagram.com/p/…",
    description: "Cuéntanos los detalles",
    descriptionPh: "Texto libre.",
    email: "E-mail de contacto",
    name: "Tu nombre",
    submitPrefix: "Continuar al pago",
    sending: "Enviando…",
    success: "Pedido creado. Redirigiendo al pago…",
    error: "No pudimos enviar. Intenta de nuevo.",
  },
};

function tr(lang: LangCode): Record<string, string> {
  return COPY[lang] ?? COPY[String(lang).split("_")[0]] ?? COPY.en;
}

export function RecoveryForm({ lang }: { lang: LangCode }) {
  const t = tr(lang);
  const { currency } = useApp();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // BUG-116 do QA 2026-06-12: validação inline antes de submit pra
    // garantir handle/email/name preenchidos mesmo se autofill burlar o
    // required nativo. Sem isso o backend retorna erro genérico depois
    // que o usuário já clicou submit e perdeu o feedback inline.
    if (!form.handle.trim()) {
      setError(t.error);
      return;
    }
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.contactEmail.trim())) {
      setError(t.error);
      return;
    }
    if (!form.contactName.trim()) {
      setError(t.error);
      return;
    }
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      // Idempotency-Key: F5 / clique duplo durante o submit volta a mesma
      // resposta em vez de criar um novo order/cobrança.
      const idem =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await fetch(`${apiBase}/v1/recovery-request`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": idem,
        },
        body: JSON.stringify({
          handle: form.handle,
          platform: form.platform,
          ban_date: form.banDate,
          estimated_reason: form.estimatedReason,
          last_publication_url: form.lastPublicationURL,
          description: form.description,
          contact_email: form.contactEmail,
          contact_name: form.contactName,
          display_currency: currency?.code ?? "USD",
          turnstile_token: turnstileToken,
          tracking: getTracking(),
        }),
      });
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
      const json = await res.json();
      const paymentURL: string | undefined = json?.data?.payment_url;
      setSuccess(true);
      if (paymentURL) {
        window.location.href = paymentURL;
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0, fontSize: "1.4rem" }}>{t.title}</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        {t.intro}
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="label">{t.handle}</label>
            <input
              className="input"
              placeholder={t.handlePh}
              required
              value={form.handle}
              onChange={(e) => update("handle", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t.platform}</label>
            <select
              className="input"
              value={form.platform}
              onChange={(e) => update("platform", e.target.value as "instagram" | "tiktok")}
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="label">{t.banDate}</label>
            <input
              className="input"
              type="date"
              required
              value={form.banDate}
              onChange={(e) => update("banDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t.estimatedReason}</label>
            <input
              className="input"
              placeholder={t.estimatedReasonPh}
              value={form.estimatedReason}
              onChange={(e) => update("estimatedReason", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">{t.lastPublication}</label>
          <input
            className="input"
            type="url"
            placeholder={t.lastPublicationPh}
            value={form.lastPublicationURL}
            onChange={(e) => update("lastPublicationURL", e.target.value)}
          />
        </div>

        <div>
          <label className="label">{t.description}</label>
          <textarea
            className="input"
            placeholder={t.descriptionPh}
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="label">{t.email}</label>
            <input
              className="input"
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t.name}</label>
            <input
              className="input"
              required
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
            />
          </div>
        </div>

        <Turnstile onToken={setTurnstileToken} />

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        {success && <p style={{ color: "var(--accent)" }}>{t.success}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: "1rem", fontSize: "1.05rem" }}
          disabled={loading}
        >
          {loading
            ? t.sending
            : `${t.submitPrefix} (${recoveryPriceLabel(
                currency?.symbol ?? "$",
                Number(currency?.rate ?? 1),
                lang,
              )})`}
        </button>
      </div>
    </form>
  );
}
