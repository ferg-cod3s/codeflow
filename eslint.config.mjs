import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Use flat-config ignores instead of .eslintignore
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'codeflow-*.js',
      'debug-path.js',
      'temp_test_fix.ts',
    ],
  },

  // Base recommended rules for JS
  js.configs.recommended,

  // JS files: enable Node-style globals
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node/Bun + test globals used throughout the project
        console: 'readonly',
        process: 'readonly',
        Bun: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Let TypeScript handle undefined symbols
      'no-undef': 'off',

      // Prefer TS-aware unused vars rule
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Triage rule to reduce noise from switch/case lexical declarations
      'no-case-declarations': 'warn',

      // Avoid failing on intentionally empty blocks in WIP areas
      'no-empty': 'warn',
    },
  },

  // Prettier compatibility handled via eslint-config-prettier when installed
  {
    rules: {},
  },
];
