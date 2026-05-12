# Synapse Pure-JS P2P Container
FROM node:20-bullseye-slim

WORKDIR /app

# Copy monorepo config
COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

# Install dependencies (Fast! No native compilation)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the SDK
RUN npm run build -w sdk

EXPOSE 10000

# Run both agents in parallel on the shared boardroom port
CMD (npx ts-node --transpile-only demo/agent-a/index.ts) & \
    sleep 5 && \
    (npx ts-node --transpile-only demo/agent-b/index.ts) & \
    wait
