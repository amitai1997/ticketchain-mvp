FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ git curl

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm install --ignore-scripts

# Copy source code (will be mounted as volume in development)
COPY . .

# Expose API port
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "start:dev"]
