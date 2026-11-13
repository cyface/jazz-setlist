import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'

export default [
  { ignores: ['dist/', '.wrangler/', 'drizzle/', 'coverage/'] },
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ['**/*.{js,jsx,svelte}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/client/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/server/**', 'src/db/**', 'src/shared/**'],
    languageOptions: { globals: { ...globals.serviceworker, __APP_VERSION__: 'readonly' } },
  },
  {
    files: ['*.js', 'scripts/**/*.js', 'src/**/*.test.{js,jsx}', 'src/server/test-env.js'],
    languageOptions: { globals: globals.node },
  },
]
