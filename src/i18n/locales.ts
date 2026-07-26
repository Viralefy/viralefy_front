// Contrato do segmento de rota `[locale]`.
//
// O quê: o valor do segmento `[locale]` é a MESMA string BCP47 que o middleware
//   já computava pro header `x-locale`, porém lowercased pra virar path seguro
//   (`pt-br`, `en`, `ja-jp`, `es-ar`). Este módulo centraliza: (1) o conjunto de
//   segmentos válidos (pra `generateStaticParams`), (2) a volta pro `<html lang>`
//   corretamente capitalizado, e (3) a direção do texto.
// Onde: consumido por `app/[locale]/layout.tsx` (lang/dir), pelo middleware
//   (rewrite) e pelas páginas que antes liam `x-locale`.
//
// Por que existe: o `<html>` só pode ser renderizado pelo root layout; pra variar
//   `lang` por URL de forma ESTÁTICA (ISR, não SSR) o locale tem que ser um route
//   param acima do layout. Ver ADR front-locale-segment-isr.

import { COUNTRIES } from "./countries";

// Espelha EXATAMENTE os locales que `detectAcceptLanguage()` (middleware) pode
// devolver pras rotas globais (sem prefixo de país). Mantê-los sincronizados é
// coberto pelo teste de contrato. Qualquer idioma daqui que NÃO seja htmlLang de
// algum país (ex.: zh-CN) só chega por Accept-Language.
const ACCEPT_LANGUAGE_LOCALES = [
  "pt-BR", "es-ES", "fr-FR", "de-DE", "ja-JP", "it-IT", "ru-RU", "nl-NL",
  "ko-KR", "ar-SA", "zh-CN", "hi-IN", "tr-TR", "pl-PL", "sv-SE", "da-DK",
  "nb-NO", "fi-FI", "he-IL", "uk-UA", "cs-CZ", "sk-SK", "th-TH", "vi-VN",
  "id-ID", "en",
];

// RTL espelha o layout antigo (ar/he/fa). `ur` é RTL de fato mas o front não
// tinha mirror de layout pra ele — manter o comportamento anterior evita
// regressão visual não-planejada; promover a RTL completo é tarefa à parte.
const RTL_LANGS = new Set(["ar", "he", "fa"]);

// localeSegment normaliza um BCP47 pro formato de path (lowercase).
// O quê: "pt-BR" → "pt-br". Onde: middleware, ao montar o rewrite.
export function localeSegment(bcp47: string): string {
  return bcp47.toLowerCase();
}

// allLocaleSegments enumera TODOS os segmentos válidos: htmlLang de cada país
// ∪ os locales de Accept-Language. Onde: `generateStaticParams` do `[locale]`.
// Segmentos fora dessa lista ainda renderizam on-demand (dynamicParams=true) —
// isto é otimização de pré-render, não gate de correção.
export function allLocaleSegments(): string[] {
  const set = new Set<string>();
  for (const c of COUNTRIES) set.add(c.htmlLang.toLowerCase());
  for (const l of ACCEPT_LANGUAGE_LOCALES) set.add(l.toLowerCase());
  return [...set];
}

// htmlLangFromSegment recapitaliza o segmento pro atributo `<html lang>`.
// O quê: "pt-br" → "pt-BR"; "en" → "en"; "zh-cn" → "zh-CN". Onde: root layout.
export function htmlLangFromSegment(seg: string): string {
  const [lang, region] = seg.split("-");
  return region ? `${lang}-${region.toUpperCase()}` : lang;
}

// dirFromSegment devolve a direção do texto. Onde: root layout (<html dir>).
export function dirFromSegment(seg: string): "ltr" | "rtl" {
  return RTL_LANGS.has(seg.split("-")[0]) ? "rtl" : "ltr";
}
