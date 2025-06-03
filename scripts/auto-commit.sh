#!/bin/bash
# Auto-commit and push script for TicketChain MVP development

# Get current branch
BRANCH=$(git branch --show-current)

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Add all changes
git add .

# Get commit message from argument or use default
COMMIT_MSG="${1:-"chore: auto-commit changes"}"

# Commit changes
git commit -m "$COMMIT_MSG"

# Push to current branch
git push origin "$BRANCH"

echo "✅ Changes committed and pushed to $BRANCH"
