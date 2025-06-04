.PHONY: help setup install test lint format clean docker-up docker-down chain deploy compile api-health api-status local-dev

# Default target
help:
	@echo "TicketChain Development Commands:"
	@echo "  make setup        - Initial project setup"
	@echo "  make install      - Install all dependencies"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run all linters"
	@echo "  make format       - Auto-format code"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make chain        - Start local Hardhat node"
	@echo "  make deploy       - Deploy contracts to local network"
	@echo "  make compile      - Compile smart contracts"
	@echo "  make api-health   - Check API health status"
	@echo "  make api-status   - Check API service status"
	@echo "  make local-dev    - Run API locally while using Docker services"

# Initial setup
setup: install
	@echo "Setting up development environment..."
	@if [ -f .env ]; then \
		echo "Warning: .env file already exists. Will not overwrite. Rename or delete it first if you want a fresh one."; \
	else \
		echo "Creating .env file from template..."; \
		cp .env.example .env; \
		echo "Created .env file. Edit it with your values."; \
	fi
	pre-commit install
	@echo "Starting Docker services for database setup..."
	make docker-up
	@echo "Setting up test database..."
	make db-test-setup
	@echo "Setup complete!"

# Install dependencies
install:
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Installing Python tools (if available)..."
	if command -v poetry >/dev/null 2>&1; then \
		echo "Poetry found, installing Python dependencies..."; \
		poetry install || echo "Poetry install failed, but continuing..."; \
	else \
		echo "Poetry not found, skipping Python dependencies."; \
	fi
	@echo "All dependencies installed!"

# Run all tests
test: test-nodejs test-contracts

test-nodejs:
	@echo "Running Node.js tests..."
	npm test -- --testPathIgnorePatterns=integration

test-contracts:
	@echo "Running Solidity tests..."
	npx hardhat test

# Linting
lint: lint-python lint-contracts

lint-python:
	@echo "Linting Python code..."
	poetry run black --check src/ tests/
	poetry run isort --check-only src/ tests/
	poetry run flake8 src/ tests/
	poetry run bandit -r src/

lint-contracts:
	@echo "Linting Solidity contracts..."
	npx solhint 'contracts/**/*.sol'

# Auto-formatting
format: format-python format-contracts

format-python:
	@echo "Formatting Python code..."
	poetry run black src/ tests/
	poetry run isort src/ tests/

format-contracts:
	@echo "Formatting Solidity contracts..."
	npx solhint 'contracts/**/*.sol' --fix

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf dist/ build/ *.egg-info
	rm -rf cache/ artifacts/ typechain/
	rm -rf coverage/ coverage.json .coverage
	rm -rf node_modules/
	@echo "Clean complete!"

# Docker commands
docker-up:
	@echo "Starting Docker services..."
	docker compose up -d
	@echo "Services started! Waiting for health checks..."
	docker compose ps
	@echo "Services running:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo "  - Hardhat Node: localhost:8545"
	@echo "  - MailHog: localhost:1025 (SMTP) / localhost:8025 (Web UI)"
	@echo "  - API Server: localhost:3000"

docker-down:
	@echo "Stopping Docker services..."
	docker compose down
	@echo "Services stopped!"

docker-restart: docker-down docker-up

docker-logs:
	docker compose logs -f

# Blockchain commands
chain:
	@echo "Starting local Hardhat node..."
	npx hardhat node

deploy:
	@echo "Deploying contracts to local network..."
	npx hardhat run scripts/deploy.js --network localhost

# Compile contracts
compile:
	@echo "Compiling smart contracts..."
	npx hardhat compile

# Coverage reports
coverage: coverage-python coverage-contracts

coverage-python:
	@echo "Generating Python coverage report..."
	poetry run pytest --cov=src --cov-report=html --cov-report=term

coverage-contracts:
	@echo "Generating Solidity coverage report..."
	npx hardhat coverage

# Security checks
security:
	@echo "Running security checks..."
	poetry run safety check
	poetry run bandit -r src/
	npm audit

# Database commands
db-migrate:
	@echo "Running database migrations..."
	poetry run alembic upgrade head

db-rollback:
	@echo "Rolling back last migration..."
	poetry run alembic downgrade -1

db-reset:
	@echo "Resetting database..."
	poetry run alembic downgrade base
	poetry run alembic upgrade head

# Test database setup
db-test-setup:
	@echo "Setting up test database..."
	@if [ -f .env.test.local ]; then \
		echo "Warning: .env.test.local file already exists. Will not overwrite."; \
	else \
		echo "Creating .env.test.local file from template..."; \
		cp .env.test .env.test.local; \
		echo "# pragma: allowlist secret" >> .env.test.local; \
		echo "TEST_DB_PASSWORD=postgres_test" >> .env.test.local; \
		echo "Created .env.test.local file with default test password."; \
	fi
	@echo "Creating test database user and database..."
	# pragma: allowlist secret
	docker exec -it ticketchain-postgres psql -U ticketchain -d ticketchain_dev -c "CREATE USER test_user WITH PASSWORD 'postgres_test';" || echo "User may already exist"
	docker exec -it ticketchain-postgres psql -U ticketchain -d ticketchain_dev -c "CREATE DATABASE ticketchain_test OWNER test_user;" || echo "Database may already exist"
	@echo "Test database setup complete!"

# Pre-commit hooks
pre-commit:
	pre-commit run --all-files

# API commands
api-health:
	@echo "Checking API health status..."
	curl -H "X-API-KEY: development" http://localhost:3000/health

api-status:
	@echo "Checking API service status..."
	curl -H "X-API-KEY: development" http://localhost:3000/health/live

# Local development
local-dev:
	@echo "Stopping Docker API container and starting local dev server..."
	docker stop ticketchain-api 2>/dev/null || true
	npm run start:local
