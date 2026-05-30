// Unit tests for the IndexNow env helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import { envIndexNow, keyLocation } from "../../src/lib/indexnow.ts";

test("envIndexNow returns non-empty key, host, siteUrl", () => {
  const e = envIndexNow();
  assert.ok(e.key && typeof e.key === "string" && e.key.length >= 16);
  assert.ok(e.host && typeof e.host === "string" && e.host.length > 0);
  assert.ok(e.siteUrl && typeof e.siteUrl === "string");
  assert.ok(/^https?:\/\//.test(e.siteUrl), `bad siteUrl: ${e.siteUrl}`);
});

test("envIndexNow.host equals new URL(siteUrl).host", () => {
  const e = envIndexNow();
  assert.equal(e.host, new URL(e.siteUrl).host);
});

test("keyLocation returns a URL ending in .txt with the key as filename", () => {
  const loc = keyLocation();
  assert.match(loc, /^https?:\/\/.+\.txt$/);
  const e = envIndexNow();
  assert.ok(loc.endsWith(`/${e.key}.txt`));
});

test("envIndexNow honours NEXT_PUBLIC_SITE_URL when set", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";
  try {
    const e = envIndexNow();
    assert.equal(e.siteUrl, "https://viralefy.com");
    assert.equal(e.host, "viralefy.com");
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  }
});

test("envIndexNow honours INDEXNOW_KEY override", () => {
  const prev = process.env.INDEXNOW_KEY;
  process.env.INDEXNOW_KEY = "0123456789abcdef0123456789abcdef";
  try {
    const e = envIndexNow();
    assert.equal(e.key, "0123456789abcdef0123456789abcdef");
  } finally {
    if (prev === undefined) delete process.env.INDEXNOW_KEY;
    else process.env.INDEXNOW_KEY = prev;
  }
});
