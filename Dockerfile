FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY sdk/package*.json ./sdk/
COPY demo/package*.json ./demo/
COPY cli/package*.json ./cli/

RUN npm install

COPY . .

RUN npm run build -w sdk

EXPOSE 10000

# Both agents share port 10000 via the UIBridge shared-server.
# We use a single entry point to run them in one process so they share memory.
CMD npx ts-node --transpile-only demo/start.ts
