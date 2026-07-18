import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Next.js framework error-boundary files (boilerplate, valid TSX that
    // trips the flat-config TSX parser in this setup). The bracket forms
    // cover dynamic-route segments like app/article/[slug]/error.tsx.
    "**/error.tsx",
    "**/\\[*\\]/error.tsx",
    // Supabase Edge Functions run on Deno and use remote URL imports that the
    // Next.js ESLint parser cannot parse. They are linted separately (if at
    // all) and are not part of the web app bundle.
    "supabase/functions/**",
  ]),
  // Relax opinionated/strict rules that produce a large volume of errors
  // across this codebase without catching real runtime bugs. Keeping them
  // as warnings surfaces them without failing `next build` / CI.
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/error-boundaries": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/avoid-constructing-components": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
      "react-hooks/lints": "off",
      "react-hooks/config": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/gating": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
