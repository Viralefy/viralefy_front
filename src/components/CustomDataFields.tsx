"use client";

import type { CategoryCode } from "@/i18n/categories";

// Campos extras renderizados no CheckoutModal conforme a categoria do plano.
// O snapshot é enviado em `custom_data` no POST /v1/checkout e replayed no
// ticket de suporte aberto após pagamento (recovery/BMs/perfis abrem
// ticket; emails segue fluxo padrão sem handoff manual).
//
// Schema livre por categoria. Backend só guarda o JSON; quem renderiza é
// quem entende as chaves.

export type CustomData = Record<string, string>;

export function hasCustomFields(category: CategoryCode): boolean {
  return (
    category === "bms_facebook" ||
    category === "perfis_redes" ||
    category === "emails_validados"
  );
}

export function CustomDataFields({
  category,
  value,
  onChange,
}: {
  category: CategoryCode;
  value: CustomData;
  onChange: (v: CustomData) => void;
}) {
  if (!hasCustomFields(category)) return null;

  function update(k: string, v: string) {
    onChange({ ...value, [k]: v });
  }

  // ===== BMs Facebook ===== //
  if (category === "bms_facebook") {
    return (
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--accent)" }}>
          Detalhes do BM
        </h4>
        <div>
          <label className="label">Use case</label>
          <select
            className="input"
            value={value.use_case ?? ""}
            onChange={(e) => update("use_case", e.target.value)}
            required
          >
            <option value="">Selecione…</option>
            <option value="scale">Escalada de campanhas</option>
            <option value="test">Teste / criativos</option>
            <option value="advanced">Casos avançados</option>
            <option value="white">White (afiliado, conformidade plena)</option>
          </select>
        </div>
        <div>
          <label className="label">Pixel ID (opcional)</label>
          <input
            className="input"
            placeholder="ex: 1234567890123"
            value={value.pixel_id ?? ""}
            onChange={(e) => update("pixel_id", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Nick desejado do BM (opcional)</label>
          <input
            className="input"
            placeholder="ex: MeuNegocio LTDA"
            value={value.preferred_nick ?? ""}
            onChange={(e) => update("preferred_nick", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Conta(s) de anúncios necessária(s)</label>
          <select
            className="input"
            value={value.ad_accounts ?? "1"}
            onChange={(e) => update("ad_accounts", e.target.value)}
          >
            <option value="1">1 conta</option>
            <option value="2">2 contas</option>
            <option value="3">3 contas</option>
            <option value="5+">5+ contas (combine com suporte)</option>
          </select>
        </div>
      </div>
    );
  }

  // ===== Perfis envelhecidos ===== //
  if (category === "perfis_redes") {
    return (
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--accent)" }}>
          Detalhes do perfil
        </h4>
        <div>
          <label className="label">Nicho desejado</label>
          <input
            className="input"
            placeholder="ex: moda feminina, fitness, finanças, lifestyle…"
            value={value.niche ?? ""}
            onChange={(e) => update("niche", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">País do público</label>
          <input
            className="input"
            placeholder="ex: Brasil, EUA, Reino Unido, global…"
            value={value.audience_country ?? ""}
            onChange={(e) => update("audience_country", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Idade mínima do perfil (meses)</label>
          <select
            className="input"
            value={value.min_age_months ?? "3"}
            onChange={(e) => update("min_age_months", e.target.value)}
          >
            <option value="1">1+ mês</option>
            <option value="3">3+ meses</option>
            <option value="6">6+ meses</option>
            <option value="12">12+ meses</option>
            <option value="24">24+ meses</option>
          </select>
        </div>
        <div>
          <label className="label">Observações (opcional)</label>
          <textarea
            className="input"
            placeholder="ex: gênero do dono original, faixa etária do público, evitar nicho X…"
            rows={3}
            value={value.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>
    );
  }

  // ===== Emails validados ===== //
  if (category === "emails_validados") {
    return (
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--accent)" }}>
          Filtros da lista
        </h4>
        <div>
          <label className="label">Nicho / intent da lista</label>
          <input
            className="input"
            placeholder="ex: e-commerce moda, B2B SaaS, infoprodutores…"
            value={value.niche ?? ""}
            onChange={(e) => update("niche", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Use case</label>
          <select
            className="input"
            value={value.use_case ?? ""}
            onChange={(e) => update("use_case", e.target.value)}
          >
            <option value="">Selecione…</option>
            <option value="cold_outreach">Cold outreach (B2B)</option>
            <option value="newsletter">Newsletter / nutrição</option>
            <option value="retargeting">Retargeting / lookalike</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div>
          <label className="label">País-alvo</label>
          <input
            className="input"
            placeholder="ex: Brasil, EUA, global…"
            value={value.country ?? ""}
            onChange={(e) => update("country", e.target.value)}
          />
        </div>
      </div>
    );
  }

  return null;
}
