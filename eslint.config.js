import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Lõi mô phỏng phải tất định: không dùng Math.random, Date.now, không import từ UI.
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Dùng Rng có hạt giống (sim/core/rng.ts).' },
        { object: 'Date', property: 'now', message: 'Lõi mô phỏng dùng đồng hồ game, không dùng giờ thật.' },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['**/ui/**', '**/store/**', '**/platform/**', 'react', 'react-dom', 'zustand'] },
      ],
    },
  },
);
