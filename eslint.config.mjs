import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore data/extracted files
  {
    ignores: [
      "app/api/linuxmancyclopedia/manpage_dump/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Global: allow underscore-prefixed unused variables
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Disable strict rules for legacy game code
  {
    files: ["app/hallways/game/**/*.ts", "app/hallways/scenes/**/*.ts", "app/hallways/scenes/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
    },
  },
  // Disable strict rules for hallways game-v2 code
  {
    files: ["app/hallways/game-v2/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Allow display-name issues for factory functions
  {
    files: ["app/WorldClock/components/**/*.tsx"],
    rules: {
      "react/display-name": "off",
    },
  },
  // Allow underscore-prefixed unused variables in UI components
  {
    files: ["lib/ui/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
