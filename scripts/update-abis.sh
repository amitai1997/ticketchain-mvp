#!/bin/sh
set -e

# Script to copy the ABI files from the artifacts directory to the src/modules/blockchain/contracts directory

echo "Copying ABI files from artifacts to src/modules/blockchain/contracts"

# Create the directory if it doesn't exist
mkdir -p src/modules/blockchain/contracts

# Copy the ABI files
cp artifacts/contracts/EventRegistry.sol/EventRegistry.json src/modules/blockchain/contracts/
cp artifacts/contracts/TicketNFT.sol/TicketNFT.json src/modules/blockchain/contracts/
cp artifacts/contracts/SimpleMarketplace.sol/SimpleMarketplace.json src/modules/blockchain/contracts/

# Copy deployment addresses for runtime access
if [ -f "deployments/latest-localhost.json" ]; then
    cp deployments/latest-localhost.json src/modules/blockchain/contracts/deployment-addresses.json
    echo "Deployment addresses copied successfully!"
else
    echo "Warning: No deployment addresses found. Creating empty file."
    echo '{}' > src/modules/blockchain/contracts/deployment-addresses.json
fi

echo "ABI files and deployment addresses copied successfully!"
