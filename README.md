# TicketChain - Blockchain Ticketing Infrastructure

[![CI](https://github.com/ticketchain/ticketchain-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/ticketchain/ticketchain-mvp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
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
- Python 3.12+
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
- API Server: http://localhost:3000
- Hardhat Node: http://localhost:8545
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MailHog UI: http://localhost:8025

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
├── src/               # Backend API (Python/FastAPI)
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
poetry run uvicorn src.main:app --reload
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

# Python tests only
make test-python

# Solidity tests only
make test-contracts
```

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

For security concerns, please email security@ticketchain.io instead of using the public issue tracker.

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat for the development framework
- Polygon for scalable blockchain infrastructure
