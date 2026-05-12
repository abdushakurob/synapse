# Optimized Synapse Agent Container for Render (P2P Hardened)
FROM node:20-bullseye as builder

WORKDIR /app

# Copy monorepo configuration
COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

# Install dependencies (including native wrtc build)
RUN npm install

# Copy all source code
COPY . .

# Build the SDK
RUN npm run build -w sdk

# Production Image
FROM node:20-bullseye-slim
WORKDIR /app

# Install ONLY the necessary runtime libraries for wrtc
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled code and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/sdk ./sdk/
COPY --from=builder /app/demo ./demo/
COPY --from=builder /app/tsconfig.json ./

# Expose UI Bridge port
EXPOSE 10000

# Use the shared process entry point
CMD npx ts-node --transpile-only demo/start.ts
