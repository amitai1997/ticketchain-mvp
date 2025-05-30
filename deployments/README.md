# Deployment Artifacts

This directory contains deployment artifacts for different networks.

## Structure

- `deployment-{network}-{timestamp}.json` - Individual deployment records
- `latest-{network}.json` - Latest deployment for each network

## Networks

- `localhost` - Local Hardhat network (gitignored)
- `amoy` - Polygon Amoy testnet
- `mainnet` - Polygon mainnet (future)

## Usage

The deployment scripts automatically save artifacts here. The latest deployment for each network is always available in `latest-{network}.json`.
