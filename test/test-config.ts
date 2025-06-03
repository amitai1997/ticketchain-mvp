import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../.env') });

// Test wallet addresses
export const TEST_ARTIST_ADDRESS = process.env.TEST_ARTIST_ADDRESS || '0x0000000000000000000000000000000000000001';
export const TEST_EVENT_REGISTRY_ADDRESS = process.env.TEST_EVENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000002';
export const TEST_TICKET_NFT_ADDRESS = process.env.TEST_TICKET_NFT_ADDRESS || '0x0000000000000000000000000000000000000003';
export const TEST_MARKETPLACE_ADDRESS = process.env.TEST_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000004';

// Export additional test configurations as needed
export const TEST_CONFIG = {
  // Default API Key for testing
  apiKey: process.env.API_KEY_SECRET || 'test-api-key',

  // Database test config
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    name: (process.env.POSTGRES_DB || 'ticketchain') + '_test',
  },

  // Blockchain test config
  blockchain: {
    provider: process.env.HARDHAT_RPC_URL || 'http://localhost:8545',
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    contracts: {
      eventRegistry: TEST_EVENT_REGISTRY_ADDRESS,
      ticketNFT: TEST_TICKET_NFT_ADDRESS,
      marketplace: TEST_MARKETPLACE_ADDRESS,
    },
  },
};
