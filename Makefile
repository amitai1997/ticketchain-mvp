.PHONY: docker-build docker-up docker-down docker-logs docker-ps docker-restart docker-clean \
        docker-logs-api docker-logs-hardhat docker-logs-deploy docker-restart-api docker-bash-api \
        dev-start dev-test dev-deploy chain deploy help

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-ps:
	docker-compose ps

docker-restart:
	docker-compose restart

docker-clean:
	docker-compose down -v

# Docker service-specific commands
docker-logs-api:
	docker-compose logs -f api

docker-logs-hardhat:
	docker-compose logs -f hardhat-node

docker-logs-deploy:
	docker-compose logs -f deploy-contracts

docker-restart-api:
	docker-compose restart api

docker-bash-api:
	docker-compose exec api sh

# Development commands
dev-start:
	npm run start:dev

dev-test:
	npm run test:all

dev-deploy:
	npm run deploy:local

# Blockchain commands
chain:
	npx hardhat node

deploy:
	npx hardhat run scripts/deploy.js --network localhost

# Help
help:
	@echo "Available commands:"
	@echo "  docker-build      - Build all Docker images"
	@echo "  docker-up         - Start all Docker services"
	@echo "  docker-down       - Stop all Docker services"
	@echo "  docker-logs       - View logs from all services"
	@echo "  docker-ps         - List running services"
	@echo "  docker-restart    - Restart all services"
	@echo "  docker-clean      - Stop all services and remove volumes"
	@echo "  docker-logs-api   - View API service logs"
	@echo "  docker-logs-hardhat - View Hardhat node logs"
	@echo "  docker-logs-deploy  - View contract deployment logs"
	@echo "  docker-restart-api  - Restart API service"
	@echo "  docker-bash-api     - Open shell in API container"
	@echo "  dev-start           - Start application in development mode"
	@echo "  dev-test            - Run all tests"
	@echo "  dev-deploy          - Deploy contracts to local node"
	@echo "  chain               - Start local Hardhat node"
	@echo "  deploy              - Deploy contracts to local network"
	@echo "  help                - Show this help message"

# Default target
default: help
