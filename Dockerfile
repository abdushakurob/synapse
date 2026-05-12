# Synapse Parallel Agent Container for Render
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

# Expose Render's default port
EXPOSE 10000

# Run both agents in parallel on the SAME shared port.
# The UIBridge handles the multiplexing via the ?agent= query param.
CMD (npx ts-node --transpile-only demo/agent-a/index.ts) & \
    sleep 5 && \
    (npx ts-node --transpile-only demo/agent-b/index.ts) & \
    wait
