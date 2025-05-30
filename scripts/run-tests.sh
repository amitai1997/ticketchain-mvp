#!/bin/bash

# TicketChain MVP Test Runner
# This script runs all tests and generates a summary report

echo "🧪 TicketChain MVP Test Suite"
echo "============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create test results directory
mkdir -p test-results

# Function to run tests and capture results
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    local output_file="test-results/${suite_name}-results.txt"

    echo -e "${YELLOW}Running ${suite_name} tests...${NC}"

    if $test_command > "$output_file" 2>&1; then
        echo -e "${GREEN}✅ ${suite_name} tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ ${suite_name} tests failed${NC}"
        return 1
    fi
}

# Track overall success
all_passed=true

# Run each test suite
run_test_suite "Unit" "npm run test:unit" || all_passed=false
run_test_suite "Integration" "npm run test:integration" || all_passed=false
run_test_suite "Gas" "npm run test:gas" || all_passed=false

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
    all_passed=false
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

    if [ "$all_passed" = true ]; then
        echo "✅ **All tests passed!**"
    else
        echo "❌ **Some tests failed**"
    fi

    echo ""
    echo "### Test Suites"
    echo "- Unit Tests: $(grep -c "passing" test-results/Unit-results.txt 2>/dev/null || echo "See details") tests"
    echo "- Integration Tests: $(grep -c "passing" test-results/Integration-results.txt 2>/dev/null || echo "See details") tests"
    echo "- Gas Tests: $(grep -c "passing" test-results/Gas-results.txt 2>/dev/null || echo "See details") tests"

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
    echo "- Gas test results: \`test-results/Gas-results.txt\`"
    echo "- Coverage report: \`coverage/lcov-report/index.html\`"
} > "$summary_file"

echo -e "\n📋 Test summary saved to: $summary_file"

# Final status
echo -e "\n============================="
if [ "$all_passed" = true ]; then
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check test-results/ for details.${NC}"
    exit 1
fi
