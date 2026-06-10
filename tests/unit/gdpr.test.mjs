// Unit tests pro consent helper (gdpr.ts).
//
// LGPD Art. 8 §3: consent livre, opt-in OBRIGATÓRIO pra analytics/marketing.
// Defaults documentados aqui são parte do contrato — qualquer regressão
// que ligar analytics=true sem opt-in explícito quebra esses testes.

import { test } from "node:test";
import assert from "node:assert/strict";

// Mock mínimo de window.localStorage pro módulo SSR-safe rodar no node.
class MemStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

class MemCustomEvent {
  constructor(name, init) {
    this.type = name;
    this.detail = init?.detail ?? null;
  }
}

const storage = new MemStorage();
globalThis.window = {
  localStorage: storage,
  dispatchEvent: () => true,
};
globalThis.CustomEvent = MemCustomEvent;

const mod = await import("../../src/lib/gdpr.ts");
const {
  getConsent,
  setConsent,
  resetConsent,
  hasAnalyticsConsent,
  hasMarketingConsent,
  GDPR_VERSION,
  GDPR_STORAGE_KEY,
} = mod;

test("getConsent returns null when storage is empty (banner shows)", () => {
  storage.clear();
  assert.equal(getConsent(), null);
});

test("setConsent({}) defaults analytics=false marketing=false preferences=true (LGPD Art. 8 §3)", () => {
  storage.clear();
  const out = setConsent({});
  assert.equal(out.necessary, true);
  assert.equal(out.preferences, true);
  assert.equal(out.analytics, false);
  assert.equal(out.marketing, false);
  assert.equal(out.version, GDPR_VERSION);
  assert.match(out.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("hasAnalyticsConsent is false by default and true only after explicit opt-in", () => {
  storage.clear();
  assert.equal(hasAnalyticsConsent(), false);
  setConsent({ analytics: true });
  assert.equal(hasAnalyticsConsent(), true);
  setConsent({ analytics: false });
  assert.equal(hasAnalyticsConsent(), false);
});

test("hasMarketingConsent honors stored flag", () => {
  storage.clear();
  setConsent({ marketing: true });
  assert.equal(hasMarketingConsent(), true);
  setConsent({ marketing: false });
  assert.equal(hasMarketingConsent(), false);
});

test("legacy v1 storage (no version field) is treated as ausente — banner reaparece", () => {
  storage.clear();
  storage.setItem(
    GDPR_STORAGE_KEY,
    JSON.stringify({ analytics: true, marketing: false, timestamp: new Date().toISOString() }),
  );
  assert.equal(getConsent(), null);
});

test("consent older than 12 months expires (re-prompt requirement)", () => {
  storage.clear();
  const oldTs = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
  storage.setItem(
    GDPR_STORAGE_KEY,
    JSON.stringify({
      version: GDPR_VERSION,
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: false,
      timestamp: oldTs,
    }),
  );
  assert.equal(getConsent(), null);
});

test("resetConsent clears the storage entirely", () => {
  storage.clear();
  setConsent({ analytics: true });
  resetConsent();
  assert.equal(storage.getItem(GDPR_STORAGE_KEY), null);
  assert.equal(getConsent(), null);
});
