# ADR 001: Testing Strategy

## Status

Accepted

## Context

The TicketChain MVP project requires a comprehensive testing strategy to ensure reliability and maintainability. We need to test both the NestJS backend API and the Solidity smart contracts.

Key concerns:

- Testing the NestJS API components (controllers, services, etc.)
- Testing smart contract functionality and security
- Ensuring database interactions work correctly
- Validating blockchain interactions
- Setting up CI/CD workflows for automated testing

## Decision

### Testing Framework Selection

1. **NestJS API Testing:**
   - Use Jest as the primary testing framework
   - Implement unit tests for isolated component testing
   - Implement integration tests for API endpoints
   - Use in-memory SQLite database for test isolation

2. **Smart Contract Testing:**
   - Use Hardhat for contract testing
   - Implement unit tests for individual contract functions
   - Implement integration tests for contract interactions
   - Gas optimization tests for critical functions

### Test Environment Configuration

1. **Database:**
   - Use SQLite in-memory database for Jest tests
   - Conditionally configure database based on NODE_ENV

2. **Environment Variables:**
   - Use .env.test for committed test configurations
   - Use .env.test.local for local test credentials (not committed to VCS)

### Test Organization

1. **Directory Structure:**

   ```
   test/
     ├── unit/                # Unit tests for NestJS components
     ├── integration/         # Integration tests for API endpoints
     ├── utils/               # Test utilities and helpers
     ├── jest.setup.ts        # Jest setup file
     └── jest.teardown.ts     # Jest teardown file
   tests/
     ├── contracts/           # Hardhat tests for contracts
       ├── unit/              # Unit tests for contracts
       ├── integration/       # Integration tests for contracts
       └── gas/               # Gas optimization tests
   ```

2. **Naming Convention:**
   - Use `.spec.ts` suffix for NestJS tests
   - Use `.test.js` suffix for contract tests

### CI/CD Integration

1. **GitHub Actions Workflow:**
   - Run Jest tests for the NestJS API
   - Run Hardhat tests for contracts
   - Generate test coverage reports
   - Fail CI on test failures or coverage drops

## Consequences

### Positive

- Clear separation of test types ensures focused testing
- In-memory database allows isolation and faster tests
- Shared test utilities reduce code duplication
- Automated CI/CD testing prevents regressions

### Negative

- Multiple testing frameworks require maintenance
- Mocking blockchain interactions adds complexity
- Additional setup required for CI environment

### Accepted Risks

- Some integration tests rely on mocked blockchain responses
- Full end-to-end tests with actual blockchain are limited to manual testing

## Implementation

1. Update Jest configuration for proper setup/teardown
2. Create utility functions for test setup
3. Implement database adaptations for SQLite compatibility
4. Establish CI/CD pipeline for automated testing
5. Document test approach in README

## Related Documents

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
