# Development Log

## 2023-11-10: Docker Containerization

- Containerized the entire application stack using Docker and Docker Compose
- Created Dockerfiles for the API and Hardhat node services
- Set up PostgreSQL, Redis, and MailHog containers
- Added health checks for all services
- Implemented proper service dependencies
- Created a dedicated contract deployment service
- Added Docker-specific environment configuration
- Created documentation for Docker setup and usage
- Added Makefile commands for Docker operations
- Created an ADR document for the Docker containerization decision
