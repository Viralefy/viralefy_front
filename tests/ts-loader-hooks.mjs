// Loader hooks invoked by Node's module customization API.
// - resolve: rewrites "@/..." to the absolute path under src/
// - load:    transpiles .ts/.tsx files through tsc.transpileModule

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve as pathResolve } from "node:path";

// Lazy import the TypeScript compiler — only when we actually need it.
let _ts = null;
async function ts() {
  if (_ts) return _ts;
  const here = dirname(fileURLToPath(import.meta.url));
  const tsPath = pathResolve(here, "..", "node_modules", "typescript", "lib", "typescript.js");
  _ts = (await import(pathToFileURL(tsPath).href)).default;
  return _ts;
}

const REPO_ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/tests$/, "");
const SRC_ROOT = join(REPO_ROOT, "src");

export async function resolve(specifier, context, nextResolve) {
  // Path alias from tsconfig: "@/*" -> "src/*"
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    // Try variants: as-is, .ts, .tsx, /index.ts
    const candidates = [
      join(SRC_ROOT, rel),
      join(SRC_ROOT, rel + ".ts"),
      join(SRC_ROOT, rel + ".tsx"),
      join(SRC_ROOT, rel, "index.ts"),
    ];
    for (const p of candidates) {
      try {
        const { stat } = await import("node:fs/promises");
        await stat(p);
        return nextResolve(pathToFileURL(p).href, context);
      } catch {
        // try next
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const T = await ts();
    const out = T.transpileModule(source, {
      compilerOptions: {
        module: T.ModuleKind.ESNext,
        target: T.ScriptTarget.ES2022,
        jsx: T.JsxEmit.ReactJSX,
        esModuleInterop: true,
        isolatedModules: true,
        resolveJsonModule: true,
        moduleResolution: T.ModuleResolutionKind.Bundler ?? T.ModuleResolutionKind.NodeNext,
      },
      fileName: fileURLToPath(url),
    });
    return {
      format: "module",
      source: out.outputText,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
