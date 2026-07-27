import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Uses eslint-config-next's native flat config exports (available since
// eslint-config-next 16) instead of FlatCompat. FlatCompat translates the
// legacy "next/core-web-vitals" shareable config into flat config at
// runtime, and that translation produces a circular reference inside
// eslint-plugin-react-hooks's config under ESLint 9 — which crashes with
// "Converting circular structure to JSON" while ESLint tries to report an
// unrelated config validation error. The native exports avoid that
// translation entirely.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
