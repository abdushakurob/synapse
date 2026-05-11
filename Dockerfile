# Use Node 20 with build tools for native modules (wrtc)
FROM node:20-bullseye-slim

# Install system dependencies for wrtc build
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

# Install all dependencies using workspaces
RUN npm install

# Copy source code
COPY . .

# Build the SDK so internal links work
RUN npm run build -w sdk

# Expose ports for both agents
EXPOSE 3001
EXPOSE 3002

# Run both agents in parallel from the root scripts
CMD npm run agent-a & npm run agent-b & wait
