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

async function tryCandidates(candidates) {
  const { stat } = await import("node:fs/promises");
  for (const p of candidates) {
    try {
      await stat(p);
      return p;
    } catch {
      // try next
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // Path alias from tsconfig: "@/*" -> "src/*"
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const candidates = [
      join(SRC_ROOT, rel),
      join(SRC_ROOT, rel + ".ts"),
      join(SRC_ROOT, rel + ".tsx"),
      join(SRC_ROOT, rel, "index.ts"),
    ];
    const found = await tryCandidates(candidates);
    if (found) return nextResolve(pathToFileURL(found).href, context);
  }
  // Relative imports sem extensão: "./schemas" -> "./schemas.ts".
  // Sem isso, value imports relativos (não type-only) explodem porque o Node
  // não acha o módulo. TS resolve isso no build; aqui resolvemos no loader.
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const hasExt = /\.[a-z0-9]+$/i.test(specifier);
    if (!hasExt) {
      const parentDir = dirname(fileURLToPath(context.parentURL));
      const base = pathResolve(parentDir, specifier);
      const candidates = [base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")];
      const found = await tryCandidates(candidates);
      if (found) return nextResolve(pathToFileURL(found).href, context);
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
