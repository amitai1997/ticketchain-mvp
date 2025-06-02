FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    build-essential \
    git \
    curl \
    wget \
    jq \
    make \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python development dependencies
RUN pip install --upgrade pip \
    && pip install poetry pre-commit

# Install Node.js development dependencies globally
RUN npm install -g npm@latest \
    && npm install -g hardhat @nomicfoundation/hardhat-toolbox solhint

# Switch to non-root user
USER vscode

# Set up shell
RUN echo 'alias ll="ls -la"' >> ~/.zshrc \
    && echo 'alias gs="git status"' >> ~/.zshrc \
    && echo 'alias gd="git diff"' >> ~/.zshrc
