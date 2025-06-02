# Security Guidelines

## Handling Sensitive Values

### Environment Variables

All sensitive information (API keys, wallet addresses, private keys, etc.) must be stored in environment variables, never hardcoded in the source code. The project provides several ways to manage environment variables:

1. `.env` file (for local development only)
2. `.env.example` file (template with placeholder values for reference)
3. `test/test-config.ts` (for loading test environment variables)

### Development Guidelines

- **Never commit actual private keys or API keys** to Git, even in `.env` files
- Use placeholder values like `YOUR_PRIVATE_KEY_HERE` in example files
- For tests, use the environment variables defined in `test/test-config.ts`
- For production, use secure environment variable management (CI/CD secrets, Kubernetes secrets, etc.)

### Test Values

For testing, the project uses environment variables for sensitive values:

- `TEST_ARTIST_ADDRESS`: Address used for artist accounts in tests
- `TEST_EVENT_REGISTRY_ADDRESS`: Address for the event registry contract in tests
- `TEST_TICKET_NFT_ADDRESS`: Address for the ticket NFT contract in tests
- `TEST_MARKETPLACE_ADDRESS`: Address for the marketplace contract in tests

### Contract Deployment

- Always use dedicated deployer accounts for each network
- Never use the same private keys for development and production
- Use different addresses for different environments (local, testnet, production)

### Local Development

When developing locally with Hardhat, you can use the default accounts provided by Hardhat, but:

1. Always remember these accounts are publicly known
2. Never send funds to these accounts on any real network
3. Use the `.env` file to store network-specific configuration
