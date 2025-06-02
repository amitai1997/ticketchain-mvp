module.exports = {
  env: {
    node: true,
    mocha: true,
    es2021: true
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2021
  },
  rules: {
    "no-unused-vars": "warn",
    "no-console": "warn",
    "no-undef": ["error", { "typeof": true }]
  },
  globals: {
    // Hardhat and testing globals
    describe: "readonly",
    beforeEach: "readonly",
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
    // Browser globals (for coverage reports)
    window: "readonly",
    document: "readonly",
    navigator: "readonly",
    setTimeout: "readonly",
    PR: "readonly"
  },
  ignorePatterns: [
    "node_modules/",
    "artifacts/",
    "cache/",
    "coverage/",
    "coverage/**",
    "dist/"
  ]
};
