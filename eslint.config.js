import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      // CLAUDE.md §4.8 — architecture rules, not style preferences.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "off", // TypeScript already handles this
    },
  },
  {
    // CLAUDE.md §4.1 — the learning layer must stay pure and independently testable.
    files: ["src/learning/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/game/**", "**/ui/**", "phaser", "react"],
              message:
                "src/learning/ must stay pure — no imports from game/, ui/, Phaser or React. See CLAUDE.md §4.1.",
            },
          ],
        },
      ],
    },
  },
  {
    // CLAUDE.md §4.2 — the game layer never touches React.
    files: ["src/game/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "src/game/ must not import React. See CLAUDE.md §4.2.",
            },
          ],
        },
      ],
    },
  },
];
