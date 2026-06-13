// plan-labels — derivação localizada de nome e descrição do plano.
//
// Catálogo no DB grava `name`/`description` em inglês (ex.: "100 followers
// Instagram", "First push"). Em mercados PT/ES/FR/DE/IT/RU os usuários
// viam essas strings inglesas misturadas com o resto da UI traduzida
// (BUG-8/47/77/127/128/129/135/171/172/173 do QA 2026-06-12).
//
// Aqui derivamos os labels a partir de (followers_qty, category, lang).
// Cobertura completa em PT+EN; outros idiomas caem em EN. Fallback final
// pro `plan.name` original quando a categoria não tem mapping.

import type { Plan } from "./api";
import type { LangCode } from "@/i18n/languages";

// Formato numérico por idioma — pt usa "1.000", en "1,000".
function formatQty(qty: number, lang: LangCode): string {
  try {
    const loc = lang === "pt" ? "pt-BR"
      : lang === "es" || lang === "es_AR" ? "es"
      : lang === "fr" ? "fr"
      : lang === "de" ? "de"
      : lang === "it" ? "it"
      : lang === "ru" ? "ru"
      : "en";
    return new Intl.NumberFormat(loc).format(qty);
  } catch {
    return String(qty);
  }
}

type UnitMap = Record<string, string>;

const UNIT_PT: UnitMap = {
  seguidores_instagram: "seguidores Instagram",
  seguidores_tiktok: "seguidores TikTok",
  curtidas_instagram: "curtidas Instagram",
  curtidas_tiktok: "curtidas TikTok",
  comentarios_instagram: "comentários Instagram",
  comentarios_tiktok: "comentários TikTok",
  compartilhamentos_instagram: "compartilhamentos Instagram",
  compartilhamentos_tiktok: "compartilhamentos TikTok",
  visualizacoes_instagram: "visualizações Instagram",
  visualizacoes_tiktok: "visualizações TikTok",
};
const UNIT_EN: UnitMap = {
  seguidores_instagram: "followers Instagram",
  seguidores_tiktok: "followers TikTok",
  curtidas_instagram: "likes Instagram",
  curtidas_tiktok: "likes TikTok",
  comentarios_instagram: "comments Instagram",
  comentarios_tiktok: "comments TikTok",
  compartilhamentos_instagram: "shares Instagram",
  compartilhamentos_tiktok: "shares TikTok",
  visualizacoes_instagram: "views Instagram",
  visualizacoes_tiktok: "views TikTok",
};
const UNIT_ES: UnitMap = {
  seguidores_instagram: "seguidores Instagram",
  seguidores_tiktok: "seguidores TikTok",
  curtidas_instagram: "me gusta Instagram",
  curtidas_tiktok: "me gusta TikTok",
  comentarios_instagram: "comentarios Instagram",
  comentarios_tiktok: "comentarios TikTok",
  compartilhamentos_instagram: "compartidos Instagram",
  compartilhamentos_tiktok: "compartidos TikTok",
  visualizacoes_instagram: "vistas Instagram",
  visualizacoes_tiktok: "vistas TikTok",
};

function unitMap(lang: LangCode): UnitMap {
  switch (lang) {
    case "pt": return UNIT_PT;
    case "es": case "es_AR": return UNIT_ES;
    default: return UNIT_EN;
  }
}

export function localizedPlanName(plan: Plan, lang: LangCode): string {
  // Para serviços e recovery — nomes próprios, traduzidos diretamente.
  if (plan.category === "servicos") {
    return SERVICOS_NAMES[plan.name]?.[lang] ?? plan.name;
  }
  if (plan.category === "recuperacao_perfil") {
    return RECOVERY_NAMES[plan.name]?.[lang] ?? plan.name;
  }

  const unit = unitMap(lang)[plan.category];
  if (!unit) return plan.name;

  const qty = plan.followers_qty;
  if (!qty || qty <= 0) return plan.name;

  return `${formatQty(qty, lang)} ${unit}`;
}

// Tier descriptions — derivadas por faixa de quantidade pra cobrir a curva
// inteira sem precisar de strings por plano. Match aproximado ao que o
// catálogo gravava em EN: "Ideal for testing", "First push", "Initial
// growth", "Steady boost", "Real audience", "Scale".
type Tier = { upTo: number; pt: string; en: string; es: string };
const FOLLOWERS_TIERS: Tier[] = [
  { upTo: 100,    pt: "Ideal pra testar",     en: "Ideal for testing",   es: "Ideal para probar" },
  { upTo: 500,    pt: "Empurrão inicial",     en: "First push",          es: "Impulso inicial" },
  { upTo: 1000,   pt: "Decolagem",            en: "Takeoff",             es: "Despegue" },
  { upTo: 2500,   pt: "Crescimento inicial",  en: "Initial growth",      es: "Crecimiento inicial" },
  { upTo: 5000,   pt: "Tração",               en: "Traction",            es: "Tracción" },
  { upTo: 10000,  pt: "Comunidade",           en: "Community",           es: "Comunidad" },
  { upTo: 25000,  pt: "Micro-influenciador",  en: "Micro-influencer",    es: "Micro-influencer" },
  { upTo: 50000,  pt: "Audiência real",       en: "Real audience",       es: "Audiencia real" },
  { upTo: 100000, pt: "Escala",               en: "Scale",               es: "Escala" },
  { upTo: 250000, pt: "Mega",                 en: "Mega",                es: "Mega" },
  { upTo: 1000000,pt: "Massa",                en: "Mass",                es: "Masa" },
  { upTo: Infinity, pt: "Gigante",            en: "Giant",               es: "Gigante" },
];

const ENGAGEMENT_TIERS: Tier[] = [
  { upTo: 50,     pt: "Conversa leve",        en: "Light conversation",  es: "Charla ligera" },
  { upTo: 100,    pt: "Empurrão",             en: "First push",          es: "Impulso" },
  { upTo: 500,    pt: "Crescimento",          en: "Initial growth",      es: "Crecimiento" },
  { upTo: 1000,   pt: "Engajamento",          en: "Steady boost",        es: "Empuje" },
  { upTo: 5000,   pt: "Mais alcance",         en: "More reach",          es: "Más alcance" },
  { upTo: 10000,  pt: "Espalhe a palavra",    en: "Spread the word",     es: "Difunde la palabra" },
  { upTo: 50000,  pt: "Escala",               en: "Scale",               es: "Escala" },
  { upTo: 100000, pt: "Massa",                en: "Mass",                es: "Masa" },
  { upTo: Infinity, pt: "Gigante",            en: "Giant",               es: "Gigante" },
];

const VIEWS_TIERS: Tier[] = [
  { upTo: 500,    pt: "Ignição",              en: "Ignition",            es: "Ignición" },
  { upTo: 1000,   pt: "Empurrão inicial",     en: "First push",          es: "Impulso inicial" },
  { upTo: 5000,   pt: "Mais alcance",         en: "More reach",          es: "Más alcance" },
  { upTo: 10000,  pt: "Crescimento",          en: "Steady growth",       es: "Crecimiento" },
  { upTo: 50000,  pt: "Escala",               en: "Scale",               es: "Escala" },
  { upTo: 100000, pt: "Massa",                en: "Mass",                es: "Masa" },
  { upTo: 1000000,pt: "Viral",                en: "Viral",               es: "Viral" },
  { upTo: Infinity, pt: "Mega",               en: "Mega",                es: "Mega" },
];

function pickTier(category: string, qty: number, lang: LangCode): string | null {
  let tiers: Tier[] | null = null;
  if (category.startsWith("seguidores_")) tiers = FOLLOWERS_TIERS;
  else if (category.startsWith("curtidas_") || category.startsWith("comentarios_") || category.startsWith("compartilhamentos_")) tiers = ENGAGEMENT_TIERS;
  else if (category.startsWith("visualizacoes_")) tiers = VIEWS_TIERS;
  if (!tiers) return null;
  const t = tiers.find((x) => qty <= x.upTo) ?? tiers[tiers.length - 1];
  if (lang === "pt") return t.pt;
  if (lang === "es" || lang === "es_AR") return t.es;
  return t.en;
}

export function localizedPlanDescription(plan: Plan, lang: LangCode): string {
  if (plan.category === "servicos") {
    return SERVICOS_DESCRIPTIONS[plan.name]?.[lang] ?? plan.description;
  }
  if (plan.category === "recuperacao_perfil") {
    return RECOVERY_DESCRIPTIONS[plan.name]?.[lang] ?? plan.description;
  }
  const tier = pickTier(plan.category, plan.followers_qty, lang);
  return tier ?? plan.description;
}

// Serviços premium — nomes próprios fixos no DB. Traduzimos diretamente
// por chave do nome em EN.
type LocalizedString = Partial<Record<LangCode, string>>;
const SERVICOS_NAMES: Record<string, LocalizedString> = {
  "Profile audit":            { pt: "Auditoria de perfil",         es: "Auditoría de perfil" },
  "Monthly management":       { pt: "Gestão mensal",               es: "Gestión mensual" },
  "Product launch":           { pt: "Lançamento de produto",       es: "Lanzamiento de producto" },
  "New account setup":        { pt: "Setup de conta nova",         es: "Configuración de cuenta nueva" },
  "Anti-shadowban package":   { pt: "Pacote anti-shadowban",       es: "Paquete anti-shadowban" },
  "Competitor analysis":      { pt: "Análise de concorrente",      es: "Análisis de competencia" },
  "Verification support":     { pt: "Suporte a verificação",       es: "Soporte de verificación" },
};
const SERVICOS_DESCRIPTIONS: Record<string, LocalizedString> = {
  "Profile audit":            { pt: "Diagnóstico + recomendações",    es: "Diagnóstico + recomendaciones" },
  "Monthly management":       { pt: "Estratégia + execução mensal",   es: "Estrategia + ejecución mensual" },
  "Product launch":           { pt: "Push pra lançamento de produto", es: "Empuje para lanzamiento" },
  "New account setup":        { pt: "Configuração de conta zerada",   es: "Configuración inicial" },
  "Anti-shadowban package":   { pt: "Diagnóstico + plano de remoção de shadowban", es: "Diagnóstico + remoción shadowban" },
  "Competitor analysis":      { pt: "Mapa de concorrente + plano",    es: "Mapa de competencia + plan" },
  "Verification support":     { pt: "Suporte completo pra verificação", es: "Soporte para verificación" },
};
const RECOVERY_NAMES: Record<string, LocalizedString> = {
  "Account recovery":         { pt: "Recuperação de conta",            es: "Recuperación de cuenta" },
};
const RECOVERY_DESCRIPTIONS: Record<string, LocalizedString> = {
  "Account recovery":         { pt: "Recuperação completa — Instagram/TikTok suspensa, hackeada ou restrita", es: "Recuperación completa — Instagram/TikTok suspendida, hackeada o restringida" },
};
