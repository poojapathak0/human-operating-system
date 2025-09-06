import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Ignore build outputs
  { ignores: ['dist/**', 'dev-dist/**'] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended (flat config)
  ...tseslint.configs.recommended,

  // Project-wide rules and React tweaks
  {
    files: ['**/*.{ts,tsx,jsx,js}'],
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Relax TS strictness for this project to avoid noisy failures
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'prefer-const': 'off'
    }
  },

  // Tests: even more permissive
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off'
    }
  },

  // Disable formatting-conflicting rules
  eslintConfigPrettier
];
