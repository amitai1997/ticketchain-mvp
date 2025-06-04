FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci

# Copy configuration files
COPY tsconfig.json ./
COPY jest.config.json ./
COPY nest-cli.json ./

# We'll mount .env.docker from the host instead of creating it here

# Copy source code
COPY src ./src

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["npm", "run", "start:dev"]
