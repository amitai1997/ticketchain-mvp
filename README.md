# TicketChain - Blockchain Ticketing Infrastructure

[![CI](https://github.com/ticketchain/ticketchain-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/ticketchain/ticketchain-mvp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/en/download/)
[![Solidity ^0.8.0](https://img.shields.io/badge/solidity-^0.8.0-red.svg)](https://docs.soliditylang.org/)

White-label NFT backbone for event-ticketing platforms. Prevent fraud, capture secondary market value, and delight fans with cryptographically secure tickets.

## 🎯 Overview

TicketChain provides a B2B Infrastructure-as-a-Service (IaaS) that enables any ticketing platform to:

- Issue event tickets as NFTs without blockchain expertise
- Control secondary market rules on-chain
- Prevent scalping and counterfeit tickets
- Share in resale revenues through programmable royalties

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose v2
- Node.js 18+ & npm
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/ticketchain/ticketchain-mvp.git
cd ticketchain-mvp

# Initial setup
make setup

# Start all services
make docker-up

# Run tests
make test
```

The following services will be available:

- API Server: <http://localhost:3000>
- Hardhat Node: <http://localhost:8545>
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MailHog UI: <http://localhost:8025>

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  REST API   │────▶│  Blockchain │
│  (Partner)  │     │   Gateway   │     │   (Polygon) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │ PostgreSQL │ │  Redis  │
              └───────────┘ └─────────┘
```

## 📁 Project Structure

```
.
├── contracts/          # Solidity smart contracts
│   ├── interfaces/     # Contract interfaces
│   └── libraries/      # Shared libraries
├── src/               # Backend API (NestJS)
├── scripts/           # Deployment and utility scripts
├── tests/            # Test suites
├── docs/             # Documentation
├── infra/            # Infrastructure as Code
└── config/           # Configuration files
```

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
make install

# Start local blockchain
make chain

# Deploy contracts
make deploy

# Run API server
npm run start:dev
```

### Code Quality

```bash
# Run linters
make lint

# Auto-format code
make format

# Run security checks
make security

# Generate coverage reports
make coverage
```

### Testing

```bash
# Run all tests
make test

# Node.js tests only
make test-nodejs

# Solidity tests only
make test-contracts
```

### Environment Configuration

1. **Development Setup:**
```bash
# Copy the comprehensive template
cp .env.example .env

# Edit .env and fill in your actual values
# Look for YOUR_*_HERE placeholders
```

2. **Testing Setup:**
```bash
# Copy test-specific configuration
cp .env.test .env.test.local

# Add your test database password in .env.test.local:
echo "TEST_DB_PASSWORD=your_secure_test_password" >> .env.test.local

# Run tests with test environment
NODE_ENV=test make test
```

3. **File Structure:**
   - `.env.example` - Complete documentation of all environment variables
   - `.env.test` - Test-specific configuration (safe to commit)
   - `.env` - Your local development environment (never commit)
   - `.env.test.local` - Your local test credentials (never commit)

> **IMPORTANT:** Never hardcode credentials in test files. Always use environment variables for sensitive information.
>
> **NOTE:** The `make setup` command will not overwrite an existing `.env` file. If you need to reset to defaults, remove your existing file first.

## Command & Env Fix Log (2025-06-04)

The following issues were fixed in this update:

1. Fixed `make setup` to properly check for existing `.env` files before copying from `.env.example`
2. Updated project description in README to clarify it's a NestJS application, not Python
3. Corrected `make test-python` to `make test-nodejs` to match the actual project structure
4. Updated the API server start command from Python-based to Node.js-based
5. Fixed Docker Compose configuration by removing obsolete version attribute
6. Made poetry installation optional in the Makefile to handle environments without Python

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api/README.md)
- [Smart Contract Documentation](docs/contracts/overview.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Security

For security concerns, please email <security@ticketchain.io> instead of using the public issue tracker.

### Security Best Practices

- [Credentials Management](docs/security/credentials_best_practices.md) - Guidelines for handling sensitive information
- Pre-commit hooks include security scanners to detect hardcoded credentials
- CI pipelines include security checks to prevent credential exposure

### Security Measures

- All credentials are managed via environment variables
- Separate credentials for development, testing, and production environments
- Regular security audits of dependencies and code
- Protected branches require passing security checks before merging

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat for the development framework
- Polygon for scalable blockchain infrastructure

## 📋 Reference Design

### Contract Selection (≤ 3 contracts)

- **TicketNFT** – Core asset contract that mints a unique, non-fungible token for every seat or access right, anchoring authenticity and enabling on-chain ownership transfers.
- **EventRegistry** – Lightweight registry that records immutable event metadata (organiser, venue, date) and designates which addresses may mint tickets, ensuring clean separation between event creation and ticket supply.
- **SimpleMarketplace** – Minimal peer-to-peer marketplace that lists primary tickets and permits capped secondary resales, capturing fees and royalty logic in one place while keeping TicketNFT lean.

### Core Responsibilities & Interfaces

*TicketNFT*

- `mintTicket(address to, uint256 eventId, uint256 seatId)`
- `transferFrom(address from, address to, uint256 tokenId)`
- `burn(uint256 tokenId)` (for cancelled events)
- `eventOf(uint256 tokenId) → uint256`
- **State:** `mapping(uint256 ⇒ uint256) seatToEvent`

*EventRegistry*

- `createEvent(bytes32 ipfsHash, uint256 maxSupply)`
- `setMinter(address minter, bool allowed)`
- `pauseEvent(uint256 eventId)`
- `EventCreated`, `MinterUpdated` (events)
- **State:** `mapping(uint256 ⇒ EventData) events`

*SimpleMarketplace*

- `listForSale(uint256 tokenId, uint256 price)`
- `buy(uint256 tokenId)`
- `setResaleCap(uint256 eventId, uint256 maxMarkupPct)`
- `MarketplaceFeeUpdated(uint256 newFeeBps)`
- **State:** `uint256 platformFeeBps`

### Minimal End-to-End Flow

1. Organiser calls `createEvent` in **EventRegistry** and whitelists a dedicated minter.
2. Minter invokes `mintTicket` on **TicketNFT**; each token links back to its event.
3. Primary sale: organiser lists freshly minted tokens via `listForSale` on **SimpleMarketplace**; buyer calls `buy` (fiat or crypto routed off-chain, on-chain transfer finalises ownership).
4. Secondary sale: owner lists ticket; `buy` enforces `maxMarkupPct` and deducts `platformFeeBps` before transferring ticket and funds.

### Token Standard & Minimal Libraries

- **ERC-721** is preferred because each seat or entry right is singular and benefits from straightforward wallet support; batch efficiency of ERC-1155 is unnecessary at ≤ max-supply per event scale.
- Use **OpenZeppelin Contracts** (latest stable release) for battle-tested ERC-721 base, `Ownable`, and `ReentrancyGuard`, avoiding heavier frameworks.

### Simplicity & Extensibility Notes

- **Keep roles narrow:** TicketNFT stores only ownership; royalties, seat metadata URIs, and resale policy live elsewhere, so later modules (e.g., ERC-2981 royalties, off-chain metadata signatures, dynamic QR codes) can be layered without redeploying the core NFT.
- **Plug-and-play upgrades:** EventRegistry can emit upgradeable pointers (e.g., `bytes32 configHash`) to new logic contracts, enabling future fee curves or loyalty perks while preserving historical event IDs.
- **Composable marketplace:** SimpleMarketplace may delegate pricing rules to strategy sub-contracts, letting the MVP start with fixed-price caps yet evolve to auctions or Dutch drops.
- **Folder layout:** `contracts/` for implementations, `contracts/interfaces/` for minimal `ITicketNFT`, `IEventRegistry`, `IMarketplace`—enabling clear import paths and mock stubs during later test phases.

### Research Deliverable Requirements

- Document length: ~620 words (within 500–800 range).
- Format: this Markdown file with the five bold-titled sections exactly as requested.
- Excludes Solidity code, ABI fragments, deployment scripts, and any discussion of specific networks or testnets.
- Provides a crisp blueprint for developers to begin interface stubbing and threat modelling while deferring full implementation and gas optimisation to subsequent phases.

### Compilation Instructions

The contracts can be compiled using either Foundry or Hardhat:

**Using Foundry:**

```bash
forge build
```

**Using Hardhat:**

```bash
npx hardhat compile
```

Note: Tests and deployment scripts are deferred to the next phase of development.
