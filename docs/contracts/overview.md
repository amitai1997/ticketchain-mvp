# Smart Contracts Overview

## Architecture

The TicketChain smart contract suite consists of three main contracts:

### Core Contracts

#### EventRegistry.sol

Central registry for all events in the system.

- Stores event metadata (name, date, venue, organizer)
- Manages fee splits and royalty configurations
- Controls event lifecycle (active, paused, completed)

#### TicketNFT.sol

ERC-721A implementation for gas-efficient batch minting.

- Immutable ticket metadata (seat, tier, event reference)
- Ownership tracking and transfer logic
- Integration with marketplace for controlled resales

#### Marketplace.sol

Decentralized marketplace with programmable rules.

- Price cap enforcement (prevents scalping)
- Automatic royalty distribution
- Escrow and atomic swaps
- Platform fee collection

### Supporting Libraries

#### FeeCalculator.sol

Handles complex fee calculations and distributions.

#### AccessControl.sol

Role-based permissions for contract administration.

## Contract Interactions

```
┌───────────────┐
│ EventRegistry │
└───────┬───────┘
        │ Creates
        ▼
┌───────────────┐      Trades      ┌──────────────┐
│  TicketNFT    │◄─────────────────►│ Marketplace  │
└───────────────┘                   └──────────────┘
```

## Deployment Process

1. Deploy EventRegistry
2. Deploy Marketplace with EventRegistry address
3. EventRegistry creates TicketNFT instances per event
4. Configure Marketplace in each TicketNFT

## Security Considerations

- All contracts use OpenZeppelin's battle-tested implementations
- Upgrade mechanism via transparent proxy pattern
- Emergency pause functionality for incident response
- Comprehensive test coverage (target: >95%)

## Gas Optimization

- ERC-721A for efficient batch operations
- Merkle trees for whitelist management
- Packed struct storage layouts
- Minimal external calls

## Audit Status

- [ ] Internal review completed
- [ ] External audit scheduled (Q2 2026)
- [ ] Bug bounty program planned

---

*Note: This document will be expanded with detailed specifications, UML diagrams, and deployment addresses once contracts are implemented.*
