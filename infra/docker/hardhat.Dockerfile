FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ git curl

# Copy package files
COPY package*.json ./
RUN npm install --ignore-scripts

# Copy contract files
COPY contracts ./contracts
COPY scripts ./scripts
COPY hardhat.config.js ./

# Expose Hardhat node port
EXPOSE 8545

# Default command
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
