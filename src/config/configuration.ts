export default () => ({
  api: {
    port: parseInt(process.env.API_PORT || process.env.PORT || '3000', 10),
    host: process.env.API_HOST || '0.0.0.0',
  },
  apiKey: process.env.API_KEY_SECRET || 'development-api-key',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'ticketchain',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  blockchain: {
    provider: process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545',
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    gasLimit: process.env.BLOCKCHAIN_GAS_LIMIT || 3000000,
    contracts: {
      eventRegistry: process.env.CONTRACT_EVENT_REGISTRY_ADDRESS,
      ticketNFT: process.env.CONTRACT_TICKET_NFT_ADDRESS,
      marketplace: process.env.CONTRACT_MARKETPLACE_ADDRESS,
    },
    retry: {
      maxAttempts: parseInt(process.env.BLOCKCHAIN_RETRY_MAX_ATTEMPTS || '3', 10),
      initialBackoff: parseInt(process.env.BLOCKCHAIN_RETRY_INITIAL_BACKOFF || '1000', 10),
      maxBackoff: parseInt(process.env.BLOCKCHAIN_RETRY_MAX_BACKOFF || '10000', 10),
      backoffFactor: parseFloat(process.env.BLOCKCHAIN_RETRY_BACKOFF_FACTOR || '2'),
    },
    network: {
      chainId: parseInt(process.env.CHAIN_ID || '31337', 10),
      name: process.env.NETWORK_NAME || 'localhost',
    },
  },
});
