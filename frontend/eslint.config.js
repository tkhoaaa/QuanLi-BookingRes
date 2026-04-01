const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  js.configs.recommended,
  ...compat.extends("eslint:recommended"),
  {
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { browser: true, es2022: true },
      settings: { react: { version: "18" } },
    },
    rules: {
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
