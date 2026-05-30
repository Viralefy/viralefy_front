// Unit tests for renderLegalBody — the markdown-lite renderer used in
// /legal/[doc]. It supports `## headings`, `- bullets` and paragraphs.

import { test } from "node:test";
import assert from "node:assert/strict";

import { renderLegalBody } from "../../src/lib/legal-render.ts";

test("renders a heading + paragraph + bullet list", () => {
  const md = "## Privacy\n\nWe respect you.\n\n- We never sell data\n- We never share data";
  const out = renderLegalBody(md);
  const types = out.map((el) => el.type);
  assert.deepEqual(types, ["h2", "p", "ul"]);
  // ul has 2 li children
  const ul = out[2];
  const lis = ul.props.children;
  assert.equal(Array.isArray(lis), true);
  assert.equal(lis.length, 2);
  for (const li of lis) {
    assert.equal(li.type, "li");
  }
});

test("counts multiple h2 sections", () => {
  const md = "## A\n\np1\n\n## B\n\np2\n\n## C";
  const out = renderLegalBody(md);
  const h2s = out.filter((el) => el.type === "h2");
  assert.equal(h2s.length, 3);
  assert.equal(h2s[0].props.children, "A");
  assert.equal(h2s[1].props.children, "B");
});

test("merges consecutive bullets into a single ul", () => {
  const md = "- one\n- two\n- three";
  const out = renderLegalBody(md);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "ul");
  assert.equal(out[0].props.children.length, 3);
});

test("blank lines are skipped without producing empty paragraphs", () => {
  const md = "p1\n\n\n\np2";
  const out = renderLegalBody(md);
  assert.equal(out.filter((el) => el.type === "p").length, 2);
});

test("empty body returns an empty array", () => {
  assert.deepEqual(renderLegalBody(""), []);
});

test("plain prose with no markdown renders as p elements", () => {
  const md = "first paragraph\nsecond paragraph";
  const out = renderLegalBody(md);
  assert.equal(out.length, 2);
  assert.equal(out.every((el) => el.type === "p"), true);
});

test("each element carries a unique React key", () => {
  const md = "## A\n\npara\n\n- li1\n- li2\n\n## B";
  const out = renderLegalBody(md);
  const keys = out.map((el) => el.key);
  assert.equal(new Set(keys).size, keys.length, "keys must be unique");
});
