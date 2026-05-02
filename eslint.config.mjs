/**
 * Root ESLint config — lightweight, no type-aware rules.
 * Per-package lint tasks use `tsc --noEmit` for type checking.
 * This config handles JS/TS general rules for root-level files.
 */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tailwindcss from 'eslint-plugin-tailwindcss';

const __dirname = dirname(fileURLToPath(import.meta.url));

const eslintConfig = [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '.turbo/',
      '*.config.ts',
      'vitest.workspace.ts',
      'test/setup.ts',
      'apps/',
      'packages/',
      'infra/',
      'docs/',
      'scripts/',
    ],
  },
  {
    files: ['*.{ts,tsx,mjs,cjs}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
    },
  },
  {
    files: ['.github/**'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      tailwindcss,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
    },
  },
];

export default eslintConfig;
