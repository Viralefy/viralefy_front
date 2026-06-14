// Renderiza o corpo dos documentos legais como HTML estruturado.
// Aceita um subset minúsculo de markdown: `## heading`, listas (`- `),
// parágrafos por linha. Auto-link emails (mailto:) e URLs absolutas
// dentro do parágrafo. BUG-31 do QA 2026-06-12: o email
// `support@viralefy.com` aparecia como texto puro no PT/EN/ES das páginas
// legais, sem virar link clicável. Agora qualquer email/URL no texto vira
// <a>.

import type { ReactElement, ReactNode } from "react";
import { createElement } from "react";

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const URL_RE = /(https?:\/\/[^\s<>"']+[A-Za-z0-9/])/g;

function autoLink(text: string, baseKey: number): ReactNode[] {
  // Quebra em tokens delimitados por matches de email/URL.
  const out: ReactNode[] = [];
  const combined = new RegExp(`${EMAIL_RE.source}|${URL_RE.source}`, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = combined.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    const isEmail = token.includes("@") && !token.startsWith("http");
    const href = isEmail ? `mailto:${token}` : token;
    out.push(
      createElement("a", { key: `${baseKey}-${k++}`, href, style: { color: "var(--accent)" } }, token),
    );
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length > 0 ? out : [text];
}

export function renderLegalBody(body: string): ReactElement[] {
  const blocks: ReactElement[] = [];
  const lines = body.split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("## ")) {
      blocks.push(createElement("h2", { key: key++, style: { marginTop: "1.75rem", marginBottom: "0.5rem", fontSize: "1.1rem" } }, line.slice(3)));
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        createElement("ul", { key: key++, style: { paddingInlineStart: "1.25rem", margin: "0.5rem 0" } },
          items.map((text, j) => createElement("li", { key: j, style: { margin: "0.25rem 0" } }, ...autoLink(text, key * 100 + j))))
      );
      continue;
    }
    blocks.push(createElement("p", { key: key++, style: { margin: "0.5rem 0", color: "var(--muted)" } }, ...autoLink(line, key * 100)));
    i++;
  }
  return blocks;
}
