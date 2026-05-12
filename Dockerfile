# Multi-Role Synapse Agent Container
FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo config
COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the SDK
RUN npm run build -w sdk

# The AGENT_TYPE env var (set in render.yaml) decides which agent to start.
# This allows one image to serve multiple roles.
CMD if [ "$AGENT_TYPE" = "agent-a" ]; then \
      npx ts-node --transpile-only demo/agent-a/index.ts; \
    else \
      npx ts-node --transpile-only demo/agent-b/index.ts; \
    fi
