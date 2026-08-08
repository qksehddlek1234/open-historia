import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // THE HOOKS RULE HAD NEVER RUN ON THIS CODEBASE.
  //
  // The block below matches **/*.{ts,tsx} and every source file here is .js or
  // .jsx, so `npx eslint src server` reported a clean tree while the app was
  // shipping React error #310 — three hooks added below an early return in the
  // feature popup, which tore down the whole map the first time a structure was
  // clicked. eslint even said so, if you read past the summary: "File ignored
  // because no matching configuration was supplied".
  //
  // Only the hooks rules are turned on for js/jsx. The recommended set on a
  // codebase this size would be a wall of style findings nobody reads, and these
  // two are the ones whose violations are a crash rather than an opinion.
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    // exhaustive-deps stays off, and so does the report for the disable comments
    // that were written against it — turning it on would bury the one rule that
    // matters here under a hundred dependency-array opinions.
    linterOptions: { reportUnusedDisableDirectives: false },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      // AND NEITHER HAD THIS ONE. A settings panel shipped calling
      // useMapSetting without importing it — a guaranteed ReferenceError the
      // moment the player opened Display & Map, and `npx eslint src` said the
      // tree was clean. Same lesson as the hooks rule above: a violation here is
      // a crash, never an opinion, which is the bar for turning something on.
      'no-undef': 'error',
    },
  },
  // The server is Node, not a browser: Buffer and process are globals there and
  // nowhere else. Without this the block above flags 31 correct uses of them,
  // which is how a rule worth having gets turned back off again.
  {
    files: ['server/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
