// Unit tests for the geo-currency helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  currencyForCountry,
  countryFromAcceptLanguage,
} from "../../src/lib/geo-currency.ts";

test("BR maps to BRL", () => {
  assert.equal(currencyForCountry("BR"), "BRL");
  assert.equal(currencyForCountry("br"), "BRL");
});

test("US/CA/AU/GB map to USD", () => {
  for (const code of ["US", "CA", "AU", "GB", "NZ", "IE"]) {
    assert.equal(currencyForCountry(code), "USD", `expected USD for ${code}`);
  }
});

test("DE/FR/IT/ES/NL map to EUR", () => {
  for (const code of ["DE", "FR", "IT", "ES", "NL", "AT", "BE", "PT", "FI"]) {
    assert.equal(currencyForCountry(code), "EUR", `expected EUR for ${code}`);
  }
});

test("Nordics (SE/DK/NO/IS) map to EUR (we don't settle in their national currencies)", () => {
  for (const code of ["SE", "DK", "NO", "IS"]) {
    assert.equal(currencyForCountry(code), "EUR", `expected EUR for ${code}`);
  }
});

test("LATAM hispanic countries map to USD", () => {
  for (const code of ["MX", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY"]) {
    assert.equal(currencyForCountry(code), "USD", `expected USD for ${code}`);
  }
});

test("Asia-Pacific defaults map to USD", () => {
  for (const code of ["JP", "KR", "IN", "PH", "SG", "HK", "TH", "VN"]) {
    assert.equal(currencyForCountry(code), "USD", `expected USD for ${code}`);
  }
});

test("Russia/Belarus/Kazakhstan/Kyrgyzstan map to USD", () => {
  for (const code of ["RU", "BY", "KZ", "KG"]) {
    assert.equal(currencyForCountry(code), "USD", `expected USD for ${code}`);
  }
});

test("Unknown / empty / null defaults to USDT (storefront global default)", () => {
  // USDT é a moeda padrão da storefront. Antes caía em USD, mas o branding
  // de produto é "USDT por padrão" — visitantes sem geo detectada veem USDT.
  assert.equal(currencyForCountry("ZZ"), "USDT");
  assert.equal(currencyForCountry(""), "USDT");
  assert.equal(currencyForCountry(null), "USDT");
  assert.equal(currencyForCountry(undefined), "USDT");
});

test("countryFromAcceptLanguage parses pt-BR", () => {
  assert.equal(countryFromAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.5"), "BR");
});

test("countryFromAcceptLanguage parses en-US even with quality", () => {
  assert.equal(countryFromAcceptLanguage("en-US,en;q=0.9"), "US");
});

test("countryFromAcceptLanguage returns null when no region present", () => {
  assert.equal(countryFromAcceptLanguage("en,pt;q=0.5"), null);
});

test("countryFromAcceptLanguage handles null/empty header", () => {
  assert.equal(countryFromAcceptLanguage(null), null);
  assert.equal(countryFromAcceptLanguage(""), null);
});

test("countryFromAcceptLanguage is uppercase in output", () => {
  assert.equal(countryFromAcceptLanguage("de-de"), "DE");
});
