#!/bin/bash
set -e

# TicketChain MVP Test Runner
# This script runs all tests and generates a summary report

echo "🧪 TicketChain MVP Test Suite"
echo "============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Create test results directory
mkdir -p test-results

# Print with timestamp
function log() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Set environment to test
export NODE_ENV=test
export ENABLE_IN_MEMORY_DB=true

log "${GREEN}Starting all tests...${NC}"

# Run Jest unit tests
log "${YELLOW}Running Jest unit tests...${NC}"
npm run test:unit
log "${GREEN}Jest unit tests completed successfully.${NC}"

# Run Jest integration tests
log "${YELLOW}Running Jest integration tests...${NC}"
npm run test:integration
log "${GREEN}Jest integration tests completed successfully.${NC}"

# Run Hardhat contract unit tests
log "${YELLOW}Running contract unit tests...${NC}"
npm run test:contracts:unit
log "${GREEN}Contract unit tests completed successfully.${NC}"

# Run Hardhat contract integration tests
log "${YELLOW}Running contract integration tests...${NC}"
npm run test:contracts:integration
log "${GREEN}Contract integration tests completed successfully.${NC}"

# Report success
log "${GREEN}All tests passed!${NC}"

# Generate coverage report
echo -e "\n${YELLOW}Generating coverage report...${NC}"
if npm run coverage > test-results/coverage-results.txt 2>&1; then
    echo -e "${GREEN}✅ Coverage report generated${NC}"

    # Extract coverage summary
    if [ -f coverage/lcov-report/index.html ]; then
        echo -e "\n📊 Coverage Summary:"
        grep -A 4 "strong" coverage/lcov-report/index.html | grep -o '[0-9.]*%' | head -4 | {
            read statements
            read branches
            read functions
            read lines
            echo "   Statements: $statements"
            echo "   Branches:   $branches"
            echo "   Functions:  $functions"
            echo "   Lines:      $lines"
        }
    fi
else
    echo -e "${RED}❌ Coverage generation failed${NC}"
fi

# Check contract sizes
echo -e "\n${YELLOW}Checking contract sizes...${NC}"
if npm run size > test-results/contract-sizes.txt 2>&1; then
    echo -e "${GREEN}✅ Contract sizes checked${NC}"
    echo -e "\n📏 Contract Sizes:"
    cat test-results/contract-sizes.txt | grep -E "(EventRegistry|SimpleMarketplace|TicketNFT)" | tail -3
else
    echo -e "${RED}❌ Contract size check failed${NC}"
fi

# Generate summary report
summary_file="test-results/test-summary-$(date +%Y%m%d-%H%M%S).md"
{
    echo "# TicketChain MVP Test Summary"
    echo "Generated: $(date)"
    echo ""
    echo "## Test Results"
    echo ""

    echo "✅ **All tests passed!**"

    echo ""
    echo "### Test Suites"
    echo "- Unit Tests: $(grep -c "passing" test-results/Unit-results.txt 2>/dev/null || echo "See details") tests"
    echo "- Integration Tests: $(grep -c "passing" test-results/Integration-results.txt 2>/dev/null || echo "See details") tests"
    echo "- Contract Tests: $(grep -c "passing" test-results/contract-results.txt 2>/dev/null || echo "See details") tests"

    echo ""
    echo "### Gas Usage Summary"
    if [ -f test-results/Gas-results.txt ]; then
        echo '```'
        grep -A 20 "Gas Usage Summary" test-results/Gas-results.txt || echo "No gas summary found"
        echo '```'
    fi

    echo ""
    echo "## Detailed Results"
    echo "See individual test result files in the \`test-results/\` directory:"
    echo "- Unit test results: \`test-results/Unit-results.txt\`"
    echo "- Integration test results: \`test-results/Integration-results.txt\`"
    echo "- Contract test results: \`test-results/contract-results.txt\`"
    echo "- Coverage report: \`coverage/lcov-report/index.html\`"
} > "$summary_file"

echo -e "\n�� Test summary saved to: $summary_file"
