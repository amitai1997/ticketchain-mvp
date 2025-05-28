FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy contract files
COPY contracts ./contracts
COPY scripts ./scripts
COPY hardhat.config.js ./

# Expose Hardhat node port
EXPOSE 8545

# Default command
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
