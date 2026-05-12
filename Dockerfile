# Hardened Synapse Agent Container (WebRTC Optimized)
FROM node:20-bullseye

# Install FULL WebRTC runtime and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libnss3 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo config
COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

# Install dependencies (will compile wrtc natively)
RUN npm install

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
