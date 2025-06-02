module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  extends: [
    "eslint:recommended"
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module"
  },
  rules: {
    "no-unused-vars": "warn",
    "no-console": "warn"
  },
  overrides: [
    // TypeScript files
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended"
      ],
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module"
      },
      rules: {
        "no-unused-vars": "off", // Turn off base rule for TS files
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "warn"
      }
    },
    // JavaScript files (contracts, scripts)
    {
      files: ["**/*.js"],
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "script"
      },
      globals: {
        // Hardhat and testing globals
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        it: "readonly",
        expect: "readonly",
        ethers: "readonly",
        hre: "readonly",
        task: "readonly",
        // Node.js globals
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        console: "readonly",
        Buffer: "readonly"
      }
    },
    // Test files - be more lenient
    {
      files: ["test/**/*.ts", "test/**/*.js", "**/*.spec.ts", "**/*.test.ts"],
      env: {
        mocha: true,
        jest: true
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "no-unused-expressions": "off",
        "@typescript-eslint/no-unused-vars": "off"
      }
    }
  ],
  ignorePatterns: [
    "node_modules/",
    "artifacts/",
    "cache/",
    "coverage/",
    "dist/",
    "*.config.js",
    "hardhat.config.js"
  ]
};
