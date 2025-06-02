# ADR 001: Docker Containerization

## Status

Accepted

## Context

The TicketChain MVP application consists of multiple components including:

- NestJS backend API
- PostgreSQL database
- Redis cache
- Hardhat Ethereum node
- Smart contracts

To simplify development, testing, and eventual deployment, we need a consistent environment that can be easily reproduced across different machines and environments.

## Decision

We will containerize the entire application stack using Docker and Docker Compose with the following components:

1. **PostgreSQL container**: For the application database
2. **Redis container**: For caching and message queuing
3. **Hardhat Node container**: For local blockchain development
4. **Contract Deployment container**: For deploying smart contracts
5. **MailHog container**: For email testing
6. **API container**: For the NestJS backend

The containerization will:

- Use Docker Compose for orchestration
- Include health checks for critical services
- Implement proper dependency management between services
- Use volume mounts for persistent data
- Configure services to communicate within a Docker network
- Use environment variables for configuration

## Consequences

### Positive

- Development environment matches production more closely
- Easier onboarding for new developers
- Consistent environment across different machines
- Isolation between services
- Simple scaling of individual components
- Easy testing of the entire stack
- Simplified CI/CD pipeline integration

### Negative

- Additional complexity for developers unfamiliar with Docker
- Potential performance overhead compared to native installation
- Need to manage Docker volumes for persistent data
- Requires additional documentation for Docker-specific workflows

## Implementation Details

1. **Docker Compose file**: Defines all services, networks, and volumes
2. **Service-specific Dockerfiles**: Custom build instructions for each service
3. **Environment configuration**: Docker-specific environment variables
4. **Health checks**: Ensure services are ready before dependent services start
5. **Volume mounts**: Persistent storage for database and shared files
6. **Network configuration**: Internal communication between services

## References

- [Docker documentation](https://docs.docker.com/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [NestJS Docker documentation](https://docs.nestjs.com/techniques/database)
