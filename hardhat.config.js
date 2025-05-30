require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

// Ensure we have required environment variables
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const ALCHEMY_MUMBAI_API_KEY = process.env.ALCHEMY_MUMBAI_API_KEY || "";
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || "";

// Choose RPC provider
const MUMBAI_RPC_URL = ALCHEMY_MUMBAI_API_KEY
  ? `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_MUMBAI_API_KEY}`
  : INFURA_PROJECT_ID
    ? `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`
    : process.env.POLYGON_AMOY_RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: false, // Disable IR-based compilation for now
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
          "": ["ast"]
        }
      },
      // Disable source maps which might be causing JSON parsing errors
      debug: {
        revertStrings: "default"
      }
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./tests/contracts",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 60000
    },

    mumbai: {
      url: MUMBAI_RPC_URL,
      chainId: 80001,
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: 35000000000, // 35 gwei
      gas: 6000000,
      timeout: 60000,
      confirmations: process.env.DEPLOYMENT_CONFIRMATIONS ? parseInt(process.env.DEPLOYMENT_CONFIRMATIONS) : 2
    }
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 35, // gwei
    outputFile: process.env.CI ? "gas-report.txt" : undefined,
    noColors: process.env.CI ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "MATIC"
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: ["EventRegistry", "SimpleMarketplace", "TicketNFT"]
  },

  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY
    }
  },

  mocha: {
    timeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : 30000
  },

  // Add specific settings to help with source map issues
  sourcify: {
    enabled: false
  }
};
