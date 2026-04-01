{
  "root": true,
  "env": { "browser": true, "es2022": true },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "settings": { "react": { "version": "18" } },
  "rules": {
    "react/prop-types": "off",
    "react/jsx-no-target-blank": "warn",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
