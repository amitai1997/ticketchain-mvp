# TicketChain MVP Deployment Guide

## Overview

This guide walks you through deploying and testing the TicketChain MVP smart contracts on the Polygon Mumbai testnet.

## Prerequisites

1. **Node.js 18.x or higher** installed
2. **Git** for version control
3. **MetaMask** or similar wallet for testnet transactions
4. **Test MATIC** tokens (get from [Mumbai Faucet](https://faucet.polygon.technology/))

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone [repository-url]
cd TicketChainMVP
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

**Required Environment Variables:**

- `DEPLOYER_PRIVATE_KEY`: Private key of the deploying account (with test MATIC)
- `ALCHEMY_MUMBAI_API_KEY`: Get from [Alchemy Dashboard](https://dashboard.alchemy.com/)
- `POLYGONSCAN_API_KEY`: Get from [Polygonscan](https://polygonscan.com/apis)

**⚠️ Security Warning:** Never commit your `.env` file or share your private keys!

### 3. Compile Contracts

```bash
npm run compile
```

This compiles all Solidity contracts and generates artifacts in the `artifacts/` directory.

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Gas optimization tests
npm run test:gas

# Coverage report
npm run coverage
```

### Expected Test Results

- **Unit Tests**: ~45 tests covering individual contract functions
- **Integration Tests**: ~15 tests covering full workflows
- **Gas Tests**: Performance benchmarks for all operations
- **Coverage**: Target ≥90% line coverage

## Deployment

### 1. Deploy to Local Hardhat Network

```bash
# Start local node
npm run node

# In another terminal
npm run deploy:local
```

### 2. Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

**Expected Output:**

```
🚀 Starting TicketChain MVP deployment...
Network: mumbai
--------------------------------------------
Deploying contracts with account: 0x...
Account balance: X.XX ETH
--------------------------------------------

1. Deploying EventRegistry...
✅ EventRegistry deployed to: 0x...
   Gas used: ~XXXXX

2. Deploying SimpleMarketplace...
✅ SimpleMarketplace deployed to: 0x...
   Gas used: ~XXXXX

3. Deploying TicketNFT...
✅ TicketNFT deployed to: 0x...
   Gas used: ~XXXXX

💾 Deployment data saved to:
   deployments/deployment-mumbai-[timestamp].json
   deployments/latest-mumbai.json

🎉 Deployment completed successfully!
```

### 3. Verify Contracts on Polygonscan

```bash
npm run verify
```

This verifies the source code on Polygonscan, allowing users to interact with contracts directly from the explorer.

## Post-Deployment Configuration

### 1. Set Marketplace Address in TicketNFT

```javascript
// Using Hardhat console
npx hardhat console --network mumbai

const TicketNFT = await ethers.getContractFactory("TicketNFT");
const ticketNFT = await TicketNFT.attach("DEPLOYED_TICKET_NFT_ADDRESS");
await ticketNFT.setMarketplace("DEPLOYED_MARKETPLACE_ADDRESS");
```

### 2. Configure Marketplace

```javascript
const Marketplace = await ethers.getContractFactory("SimpleMarketplace");
const marketplace = await Marketplace.attach("DEPLOYED_MARKETPLACE_ADDRESS");

// Set TicketNFT address
await marketplace.setTicketNFT("DEPLOYED_TICKET_NFT_ADDRESS");

// Set platform fee (2.5% = 250)
await marketplace.setPlatformFee(250);

// Set platform address for fee collection
await marketplace.setPlatformAddress("YOUR_PLATFORM_ADDRESS");
```

## Interacting with Deployed Contracts

### Create an Event

```javascript
const EventRegistry = await ethers.getContractFactory("EventRegistry");
const eventRegistry = await EventRegistry.attach("DEPLOYED_EVENT_REGISTRY_ADDRESS");

const tx = await eventRegistry.createEvent(
  "Summer Music Festival",           // name
  Math.floor(Date.now() / 1000) + 30 * 86400, // date (30 days from now)
  "Madison Square Garden",           // venue
  5000,                             // totalTickets
  ethers.utils.parseEther("0.1"),  // pricePerTicket (0.1 MATIC)
  ethers.utils.parseEther("0.11"), // maxResalePrice (10% markup)
  500,                              // royaltyPercentage (5%)
  "0xARTIST_ADDRESS"               // artistAddress
);

await tx.wait();
console.log("Event created!");
```

### Mint Tickets

```javascript
const ticketNFT = await TicketNFT.attach("DEPLOYED_TICKET_NFT_ADDRESS");

// Mint ticket for event ID 1, seat 42
await ticketNFT.mintTicket(
  1,                    // eventId
  "0xBUYER_ADDRESS",   // to
  42,                  // seatNumber
  ""                   // tokenURI (optional)
);
```

## Monitoring and Maintenance

### View Contract State

- **Polygonscan**: View transactions, events, and read contract state
- **Gas Usage**: Monitor gas consumption in deployment artifacts
- **Event Logs**: Use ethers.js to listen for contract events

### Emergency Procedures

1. **Pause Marketplace**:

```javascript
await marketplace.pause();
```

2. **Pause Transfers**:

```javascript
await ticketNFT.setTransfersPaused(true);
```

3. **Update Authorized Minters**:

```javascript
await eventRegistry.setAuthorizedMinter("ADDRESS", true/false);
```

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**: Ensure deployer account has enough test MATIC
2. **"Nonce too low"**: Reset MetaMask account or wait for pending transactions
3. **"Contract size exceeds limit"**: Enable optimizer in `hardhat.config.js`
4. **"Rate limit exceeded"**: Use backup RPC provider or wait

### Debug Commands

```bash
# Check contract sizes
npm run size

# Run specific test file
npx hardhat test tests/contracts/unit/EventRegistry.test.js

# Get account balance
npx hardhat console --network mumbai
> const [signer] = await ethers.getSigners()
> await signer.getBalance()
```

## CI/CD Pipeline

The project includes GitHub Actions workflows that automatically:

1. Run tests on every push
2. Generate coverage reports
3. Deploy to Mumbai on push to `deploy/mumbai` branch
4. Verify contracts post-deployment

To trigger automatic deployment:

```bash
git checkout -b deploy/mumbai
git push origin deploy/mumbai
```

## Next Steps

1. **Integration Testing**: Test with your ticketing platform API
2. **Frontend Development**: Build user interfaces for ticket purchase/resale
3. **Security Audit**: Conduct thorough security review before mainnet
4. **Documentation**: Generate API documentation for platform integrators
5. **Mainnet Preparation**: Update configurations for Polygon mainnet

## Support

For issues or questions:

- Check the [test results](./test-results/) directory
- Review deployment artifacts in `deployments/`
- Consult the technical documentation in `docs/`

Remember to always test thoroughly on testnet before any mainnet deployment!
