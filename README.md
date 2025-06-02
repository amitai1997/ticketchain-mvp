# TicketChain MVP

Blockchain-based ticketing platform using Ethereum smart contracts and NestJS.

## Project Overview

TicketChain is a platform that enables event organizers to create and sell tickets using blockchain technology, providing benefits such as:

- Ticket authenticity verification
- Secondary market control
- Royalties for artists on resales
- Prevention of scalping and fraud

## Technology Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Blockchain**: Ethereum (Hardhat for local development)
- **Smart Contracts**: Solidity
- **API**: REST and GraphQL
- **Queue**: Bull with Redis
- **Testing**: Jest

## Project Structure

The project follows a modular architecture:

```
src/
  ├── common/            # Shared utilities, filters, guards, etc.
  ├── config/            # Configuration handling
  ├── modules/
  │   ├── blockchain/    # Blockchain interaction services
  │   ├── events/        # Event management
  │   ├── tickets/       # Ticket operations
  │   ├── wallets/       # Wallet management
  │   ├── cache/         # Caching services
  │   ├── queue/         # Background job processing
  │   └── database/      # Database connection and repositories
  └── graphql/           # GraphQL schemas and resolvers
```

## Smart Contracts

- **EventRegistry**: Manages event creation and metadata
- **TicketNFT**: ERC-721 implementation for tickets
- **SimpleMarketplace**: Handles primary and secondary sales

## Completed Features (Sprint 1)

### Foundation and Events Module

- Project Setup
  - NestJS application with TypeScript configuration
  - PostgreSQL integration with TypeORM
  - Redis connection for caching and queue
  - Base module structure

- Common Module
  - API key authentication guard
  - Validation pipes and DTOs
  - Exception filters (HTTP and Blockchain)
  - Logging and transform interceptors
  - Swagger documentation

- Blockchain Module
  - Integration with ethers.js for Ethereum interaction
  - Contract ABIs and interfaces
  - Provider management and connection
  - Transaction retry logic with exponential backoff

- Events Module (REST)
  - Event entity and repository
  - CRUD operations with validation
  - Integration with EventRegistry smart contract
  - Event status management

- Events Module (GraphQL)
  - Apollo Server integration
  - Event types, inputs, and resolver
  - GraphQL queries and mutations

- Testing
  - Unit tests for services, controllers, and resolvers
  - Mock implementations for blockchain interactions
  - Integration tests with test database

## Docker Setup

The entire application stack can be run using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# Check the status of the services
docker-compose ps

# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f api
```

### Services Included

- **PostgreSQL**: Database for storing application data
- **Redis**: Cache and queue management
- **Hardhat Node**: Local Ethereum blockchain for development
- **MailHog**: SMTP testing server with web UI
- **API**: NestJS application backend

### Accessing Services

- API: <http://localhost:3000>
- API Documentation (Swagger): <http://localhost:3000/api>
- MailHog UI: <http://localhost:8025>
- Hardhat JSON-RPC: <http://localhost:8545>

### Deploy Smart Contracts in Docker

```bash
# Execute the deployment script in the API container
docker-compose exec api sh /app/scripts/docker-deploy.sh
```

## Local Development Setup

### Prerequisites

- Node.js v18+
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/ticketchain-mvp.git
cd ticketchain-mvp
```

2. Install dependencies

```bash
npm install
```

3. Copy environment template and configure

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up pre-commit hooks for development

```bash
# Install pre-commit
pip install pre-commit

# Set up hooks with default configuration (node_modules-friendly)
pre-commit install
```

5. Use the safe commit script to ensure pre-commit hooks run correctly

```bash
# This script runs all pre-commit hooks and handles commits properly
./scripts/safe-commit.sh "your commit message"
```

6. Start a local Hardhat node

```bash
npm run node
```

7. Deploy contracts to local node

```bash
npm run deploy:local
```

8. Start the application in development mode

```bash
npm run start:dev
```

## Testing

```bash
# Run all tests
npm run test:all

# Run only contract tests
npm run test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run gas usage tests
npm run test:gas

# Generate coverage report
npm run coverage
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Test change to verify pre-commit hooks
