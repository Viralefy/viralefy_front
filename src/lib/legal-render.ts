// Renderiza o corpo dos documentos legais como HTML estruturado.
// Aceita um subset minúsculo de markdown: `## heading` e parágrafos por linha.

import type { ReactElement } from "react";
import { createElement } from "react";

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
        createElement("ul", { key: key++, style: { paddingLeft: "1.25rem", margin: "0.5rem 0" } },
          items.map((text, j) => createElement("li", { key: j, style: { margin: "0.25rem 0" } }, text)))
      );
      continue;
    }
    blocks.push(createElement("p", { key: key++, style: { margin: "0.5rem 0", color: "var(--muted)" } }, line));
    i++;
  }
  return blocks;
}
