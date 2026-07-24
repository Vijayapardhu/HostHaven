import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Matches frontend/ and vendor/. The ~214 `any` usages here are real
      // debt, tracked separately — they are not a reason to hold admin to a
      // different bar than the other two apps.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'off',
      // Console output ships to the production browser console; warn/error are
      // kept for genuine failure reporting.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Tests may log freely.
    files: ['**/*.test.{ts,tsx}', '**/test/**'],
    rules: { 'no-console': 'off' },
  },
)
