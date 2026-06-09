import type { CategoryCode } from "@/i18n/categories";

// Custom data fields por categoria. Mantemos a interface estável pra
// CheckoutModal continuar importando sem mudanças — atualmente NENHUMA
// categoria ativa requer custom fields (os 3 antigos: bms_facebook,
// perfis_redes, emails_validados foram descontinuados em 2026-06-09).
//
// Quando uma nova categoria precisar, voltar com o switch case + UI
// específica e o backend só guardar Record<string,string> no campo
// orders.custom_data (jsonb).

export type CustomData = Record<string, string>;

export function hasCustomFields(_category: CategoryCode): boolean {
  return false;
}

export function CustomDataFields(_props: {
  category: CategoryCode;
  value: CustomData;
  onChange: (v: CustomData) => void;
}) {
  return null;
}
