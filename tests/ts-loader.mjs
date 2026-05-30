// Tiny Node module-customization hook that transpiles .ts files on the
// fly using the local TypeScript compiler (already in node_modules).
//
// Reason this exists: Node 25's native --experimental-strip-types can't
// handle some TS syntax that appears in the source (angle-bracket type
// assertions like `<Labels>{...}` in src/i18n/countries.ts). We can't
// modify source files, so we hand .ts files to tsc.transpileModule
// instead, which understands everything.
//
// Also resolves the tsconfig "@/..." path alias to "<root>/src/...".
//
// Wire it in with:  node --import ./tests/ts-loader.mjs ...
// or as a customization hook:  node --experimental-loader ./tests/ts-loader.mjs ...

import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-loader-hooks.mjs", import.meta.url);
