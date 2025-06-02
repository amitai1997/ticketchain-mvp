# Docker Setup Guide

This document provides instructions for running the TicketChain MVP application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

1. Build the Docker images:

```bash
make docker-build
```

2. Start all services:

```bash
make docker-up
```

3. Check the status of services:

```bash
make docker-ps
```

4. View logs from all services:

```bash
make docker-logs
```

5. Stop all services:

```bash
make docker-down
```

## Services

The Docker setup includes the following services:

- **postgres**: PostgreSQL database
- **redis**: Redis cache and message broker
- **hardhat-node**: Local Ethereum blockchain for development
- **deploy-contracts**: Service that deploys smart contracts to the hardhat-node
- **mailhog**: Email testing service with web UI
- **api**: NestJS backend API service

## Service Access

- **API**: <http://localhost:3000>
  - Swagger API documentation: <http://localhost:3000/api>
  - GraphQL playground: <http://localhost:3000/graphql>
- **MailHog**: <http://localhost:8025>
- **Hardhat Node**: <http://localhost:8545> (JSON-RPC endpoint)
- **PostgreSQL**: localhost:5432
  - Username: ticketchain
  - Password: development (or as specified in .env)
  - Database: ticketchain_dev
- **Redis**: localhost:6379

## Common Tasks

### View logs from a specific service

```bash
# View API logs
make docker-logs-api

# View Hardhat node logs
make docker-logs-hardhat

# View contract deployment logs
make docker-logs-deploy
```

### Access a shell in a container

```bash
# Access a shell in the API container
make docker-bash-api
```

### Restart a specific service

```bash
# Restart the API service
make docker-restart-api
```

### Clean up everything (including volumes)

```bash
make docker-clean
```

## Environment Variables

The Docker services use environment variables from `.env.docker`. You can modify this file to change configuration settings.

Key environment variables:

- `POSTGRES_PASSWORD`: Password for the PostgreSQL database
- `API_PORT`: Port for the API service (default: 3000)
- `JWT_SECRET`: Secret key for JWT token generation

## Troubleshooting

### Services not starting properly

Check the logs for error messages:

```bash
make docker-logs
```

### Database connection issues

Verify that the PostgreSQL service is running:

```bash
make docker-ps
```

Check the PostgreSQL logs:

```bash
docker-compose logs postgres
```

### Smart contract deployment failures

Check the deployment logs:

```bash
make docker-logs-deploy
```

### API not responding

Check the API logs:

```bash
make docker-logs-api
```

Restart the API service:

```bash
make docker-restart-api
```
