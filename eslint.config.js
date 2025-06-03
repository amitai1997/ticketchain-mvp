const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    // Base configuration for all files
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    // TypeScript files configuration
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
  {
    // JavaScript files configuration
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
  {
    // Test files - more lenient rules
    files: ['**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts', 'test/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Ignored files and directories
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.min.js',
      'artifacts/**',
      'cache/**',
      'typechain-types/**',
      '.eslintrc.js', // Old config file
      'hardhat.config.js',
      'deployments/**/*.json',
    ],
  },
];
