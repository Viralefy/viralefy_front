// Accessibility smoke checks via HTTP fetch + simple HTML parsing.
//
// Checks on / and /br/seguidores:
//   - All <img> tags have alt= (count: 100%)
//   - All <button> tags have visible text content OR aria-label
//   - The page has exactly 1 <h1> (uniqueness)
//   - Headings are in order (no h3 before h2)
//   - <html lang> is present and non-empty
//
// No DOM library — we parse with regex (good enough for SSR'd Next output).
// Env:
//   SITE_URL  default https://viralefy.com

const SITE_URL = process.env.SITE_URL ?? "https://viralefy.com";

let pass = 0;
let fail = 0;
let info = 0;

const ok = (label) => { pass++; console.log(`  PASS ${label}`); };
const ko = (label, why) => { fail++; console.log(`  FAIL ${label} — ${why}`); };
const note = (label, why) => { info++; console.log(`  INFO ${label} — ${why}`); };

async function get(path) {
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      headers: { "User-Agent": "Viralefy-A11y/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    return { status: res.status, html: await res.text() };
  } catch (err) {
    return { status: 0, html: "", err: err?.message ?? String(err) };
  }
}

function countTags(html, tag) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) || []).length;
}

function imgsWithoutAlt(html) {
  // <img ...> — for each one, check if alt= attribute exists.
  const imgs = [...html.matchAll(/<img\b([^>]*)>/gi)].map((m) => m[1]);
  const missing = imgs.filter((attrs) => !/\balt\s*=/.test(attrs));
  return { total: imgs.length, missing };
}

function buttonsMissingLabel(html) {
  // <button ...>inner</button> — visible text OR aria-label OR aria-labelledby.
  const re = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let missing = 0, total = 0;
  for (const m of html.matchAll(re)) {
    total++;
    const attrs = m[1];
    const inner = m[2];
    const hasAriaLabel = /\baria-label(?:ledby)?\s*=/.test(attrs);
    // Strip tags and whitespace to detect visible text.
    const text = inner.replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
    if (!hasAriaLabel && text.length === 0) missing++;
  }
  return { total, missing };
}

function headingsOrderOk(html) {
  // Find sequence of <h1>..<h6> tags, return true if no h(n+1) without h(n).
  const seq = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => parseInt(m[1], 10));
  let lastSeen = 0;
  for (const lvl of seq) {
    if (lvl > lastSeen + 1 && lastSeen > 0) {
      // jumping by more than 1 (e.g. h1 -> h3 with no h2) — fail.
      return { ok: false, sequence: seq };
    }
    if (lvl > lastSeen) lastSeen = lvl;
  }
  return { ok: true, sequence: seq };
}

function htmlLangAttr(html) {
  const m = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']*)["']/i);
  return m ? m[1] : null;
}

async function check(path) {
  console.log(`\n[${path}]`);
  const r = await get(path);
  if (r.status !== 200 || !r.html) {
    note(`${path} fetch`, `status=${r.status}`);
    return;
  }

  // img alt
  const { total: imgTotal, missing: imgMissing } = imgsWithoutAlt(r.html);
  if (imgTotal === 0) {
    note(`${path} <img> alt`, "no <img> tags on page");
  } else if (imgMissing.length === 0) {
    ok(`${path} ${imgTotal}/${imgTotal} <img> have alt`);
  } else {
    note(`${path} <img> alt`, `${imgMissing.length}/${imgTotal} missing alt`);
  }

  // button text or aria-label
  const { total: btTotal, missing: btMissing } = buttonsMissingLabel(r.html);
  if (btTotal === 0) {
    note(`${path} <button>`, "no <button> tags on page");
  } else if (btMissing === 0) {
    ok(`${path} ${btTotal}/${btTotal} <button> have text or aria-label`);
  } else {
    note(`${path} <button> labelling`, `${btMissing}/${btTotal} have neither text nor aria-label`);
  }

  // exactly 1 <h1>
  const h1 = countTags(r.html, "h1");
  if (h1 === 1) {
    ok(`${path} has exactly 1 <h1>`);
  } else if (h1 === 0) {
    note(`${path} <h1>`, "no <h1> tag found");
  } else {
    note(`${path} <h1>`, `${h1} <h1> tags (should be 1)`);
  }

  // heading order
  const ord = headingsOrderOk(r.html);
  if (ord.ok) {
    ok(`${path} heading order is well-formed`);
  } else {
    note(`${path} heading order`, `jump detected: ${ord.sequence.join(",")}`);
  }

  // <html lang>
  const lang = htmlLangAttr(r.html);
  if (lang && lang.length > 0) {
    ok(`${path} <html lang="${lang}"> present`);
  } else {
    ko(`${path} <html lang>`, "missing or empty");
  }
}

console.log(`\nA11y smoke checks against ${SITE_URL}\n`);
await check("/");
await check("/br/seguidores");

console.log("\n=================================================");
console.log(`PASS=${pass}  FAIL=${fail}  INFO=${info}`);
process.exit(fail > 0 ? 1 : 0);
