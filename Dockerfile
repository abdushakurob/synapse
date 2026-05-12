# Optimized Synapse Agent Container
FROM node:20-bullseye-slim

# Install system dependencies for native modules (wrtc/tweetnacl)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo configuration
COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

# Install dependencies (using --omit=dev to keep image small, 
# but including ts-node for execution)
RUN npm install

# Copy source code
COPY . .

# Pre-build the SDK so it's ready for the agents
RUN npm run build -w sdk

# Expose UI Bridge ports
EXPOSE 3001
EXPOSE 3002

# Run with --transpile-only for 3x faster startup and lower memory.
# We stagger the starts by 2s to prevent OOM spikes.
CMD (npx ts-node --transpile-only demo/agent-a/index.ts) & \
    sleep 2 && \
    (npx ts-node --transpile-only demo/agent-b/index.ts) & \
    wait
