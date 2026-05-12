# Hardened Synapse Agent Container (Native Build Optimized)
FROM node:20-bullseye

# Install FULL WebRTC build and runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libnss3-dev \
    libasound2-dev \
    libatk1.0-dev \
    libdbus-1-dev \
    libexpat1-dev \
    libfontconfig1-dev \
    libgbm-dev \
    libglib2.0-dev \
    libgtk-3-dev \
    libnspr4-dev \
    libpango1.0-dev \
    libx11-dev \
    libxcomposite-dev \
    libxcursor-dev \
    libxdamage-dev \
    libxext-dev \
    libxfixes-dev \
    libxi-dev \
    libxrandr-dev \
    libxrender-dev \
    libxss-dev \
    libxtst-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo config
COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

# Install dependencies (Forcing native build for wrtc)
# We use --legacy-peer-deps to avoid monorepo linking issues during build
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the SDK
RUN npm run build -w sdk

EXPOSE 10000

# Run with transpile-only for speed
CMD (npx ts-node --transpile-only demo/agent-a/index.ts) & \
    sleep 5 && \
    (npx ts-node --transpile-only demo/agent-b/index.ts) & \
    wait
