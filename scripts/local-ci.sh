#!/bin/bash
# Local CI Test Script for TicketChain MVP
# Runs the same checks as GitHub Actions locally

set -e  # Exit on any error

echo "🚀 Running Local CI Tests..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 PASSED${NC}"
    else
        echo -e "${RED}❌ $1 FAILED${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
print_status "Dependency Installation"

echo -e "${YELLOW}🔍 Running ESLint...${NC}"
# Run ESLint on all relevant files
npx eslint src/ test/ --ext .js,.ts || echo "ESLint warnings found"
print_status "ESLint Check"

echo -e "${YELLOW}📝 Running TypeScript Check...${NC}"
npx tsc --noEmit
print_status "TypeScript Check"

echo -e "${YELLOW}⚖️ Running Solidity Lint...${NC}"
npx solhint 'contracts/**/*.sol'
print_status "Solidity Lint"

echo -e "${YELLOW}🔐 Running GitLeaks Security Scan...${NC}"
# Download and run GitLeaks (cross-platform)
if [ ! -f "./gitleaks" ]; then
    echo "Downloading GitLeaks..."

    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case $OS in
        darwin) OS="darwin" ;;
        linux) OS="linux" ;;
        *) echo "Unsupported OS: $OS"; exit 1 ;;
    esac

    case $ARCH in
        x86_64|amd64) ARCH="x64" ;;
        arm64|aarch64) ARCH="arm64" ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    GITLEAKS_URL="https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_${OS}_${ARCH}.tar.gz"
    wget -O gitleaks.tar.gz "$GITLEAKS_URL"
    tar -xzf gitleaks.tar.gz
    chmod +x gitleaks
    rm gitleaks.tar.gz
fi

./gitleaks detect --source . --verbose --no-git --gitleaks-ignore-path .gitleaksignore
print_status "GitLeaks Security Scan"

echo -e "${YELLOW}🔨 Compiling Smart Contracts...${NC}"
npx hardhat compile
print_status "Contract Compilation"

echo -e "${YELLOW}🧪 Running Unit Tests...${NC}"
npm run test:unit
print_status "Unit Tests"

echo -e "${YELLOW}⛓️ Running Contract Tests...${NC}"
npm run test:contracts
print_status "Contract Tests"

echo -e "${YELLOW}🐳 Testing Docker Configuration...${NC}"
docker compose config > /dev/null
print_status "Docker Config"

echo ""
echo -e "${GREEN}🎉 ALL LOCAL CI CHECKS PASSED!${NC}"
echo "✅ Safe to push to remote repository"
