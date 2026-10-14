import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'raycast-env.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['src/**/*.ts', 'src/**/*.tsx'],
  })),
  {
    files: ['tests/**/*.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        AbortController: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.cjs', 'eslint.config.mjs'],
    rules: {
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'func-style': ['error', 'expression'],
      'no-nested-ternary': 'error',
    },
  },
]
