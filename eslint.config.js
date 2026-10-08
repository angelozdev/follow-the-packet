import js from '@eslint/js';
import globals from 'globals';
import noComments from 'eslint-plugin-no-comments';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { 'no-comments': noComments },
    rules: {
      'no-comments/disallowComments': ['error', { allow: ['\\*', '@vitest-environment', 'eslint', 'global'] }],
    },
  },
);
