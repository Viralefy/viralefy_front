// Integration-style tests for the theme switcher across the
// getTheme/setTheme/toggleTheme triplet.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as theme from "../../src/lib/theme.ts";

// Localstorage shim (same trick as theme.test.mjs).
function installShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  return globalThis.localStorage;
}

test("toggleTheme() flips dark -> light", () => {
  installShim();
  theme.setTheme("dark");
  const next = theme.toggleTheme();
  assert.equal(next, "light");
  assert.equal(theme.getTheme(), "light");
});

test("toggleTheme() flips light -> dark", () => {
  installShim();
  theme.setTheme("light");
  const next = theme.toggleTheme();
  assert.equal(next, "dark");
  assert.equal(theme.getTheme(), "dark");
});

test("getTheme returns 'dark' for empty/invalid localStorage", () => {
  installShim();
  assert.equal(theme.getTheme(), "dark");
});

test("getTheme returns 'dark' when an unknown value is stored", () => {
  const ls = installShim();
  ls.setItem("viralefy_theme", "neon-purple");
  // theme.ts coerces anything-not-light to dark.
  assert.equal(theme.getTheme(), "dark");
});

test("setTheme writes the value (even an invalid one — writes are caller-responsible)", () => {
  const ls = installShim();
  theme.setTheme("light");
  assert.equal(ls.getItem("viralefy_theme"), "light");
  theme.setTheme("dark");
  assert.equal(ls.getItem("viralefy_theme"), "dark");
});

test("toggleTheme returns the new theme value (chainable contract)", () => {
  installShim();
  theme.setTheme("dark");
  assert.equal(theme.toggleTheme(), "light");
  assert.equal(theme.toggleTheme(), "dark");
});

test("multiple toggleTheme calls cycle (dark -> light -> dark -> light)", () => {
  installShim();
  theme.setTheme("dark");
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(theme.toggleTheme());
  assert.deepEqual(seq, ["light", "dark", "light", "dark"]);
});

test("getTheme is safe when localStorage is not installed (SSR scenario)", () => {
  // Remove the shim — emulate SSR / no DOM.
  delete globalThis.localStorage;
  assert.equal(theme.getTheme(), "dark");
});
