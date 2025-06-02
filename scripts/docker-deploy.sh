#!/bin/bash
set -e

echo "Starting contract deployment in Docker environment..."

# Wait for hardhat node to be ready
echo "Waiting for Hardhat node to be ready..."
until curl -s http://hardhat-node:8545 > /dev/null 2>&1; do
  echo "Waiting for hardhat-node..."
  sleep 2
done

echo "Hardhat node is ready!"

# Deploy contracts to dockerLocalhost network
echo "Deploying contracts to dockerLocalhost network..."
npx hardhat run scripts/deploy.js --network dockerLocalhost

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "Contract deployment completed successfully!"

    # Copy deployment addresses to src for API access
    if [ -f "deployments/latest-localhost.json" ]; then
        mkdir -p src/modules/blockchain/contracts
        cp deployments/latest-localhost.json src/modules/blockchain/contracts/deployment-addresses.json
        echo "Deployment addresses copied to src/modules/blockchain/contracts/"
    else
        echo "Warning: Deployment addresses file not found!"
    fi
else
    echo "Contract deployment failed!"
    exit 1
fi
