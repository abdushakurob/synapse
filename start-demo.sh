#!/bin/bash

# Kill any existing demo processes
pkill -f ts-node || true
pkill -f vite || true

# Build SDK to ensure latest methods are available
(cd sdk && npm run build)

# Create wallets if they don't exist
if [ ! -f "dev-wallet-a.json" ]; then
  echo "Creating Wallet A..."
  solana-keygen new --no-passphrase -o dev-wallet-a.json
  solana airdrop 1 -u devnet -k dev-wallet-a.json
  echo "Waiting for Wallet A balance..."
  while [ $(solana balance -u devnet -k dev-wallet-a.json | cut -d' ' -f1 | cut -d. -f1) -eq 0 ]; do sleep 1; done
fi

if [ ! -f "dev-wallet-b.json" ]; then
  echo "Creating Wallet B..."
  solana-keygen new --no-passphrase -o dev-wallet-b.json
  solana airdrop 1 -u devnet -k dev-wallet-b.json
  echo "Waiting for Wallet B balance..."
  while [ $(solana balance -u devnet -k dev-wallet-b.json | cut -d' ' -f1 | cut -d. -f1) -eq 0 ]; do sleep 1; done
fi

echo "---------------------------------------------------------"
echo "🚀 SYNAPSE PROTOCOL DEMO"
echo "---------------------------------------------------------"

echo "[1/3] Starting Meridian Trading (Agent B) on Port 3002..."
(cd demo && npm run agent-b > agent-b.log 2>&1) &
B_PID=$!

echo "[2/3] Starting React Frontend (Web)..."
(cd web && npm run dev > web.log 2>&1) &
WEB_PID=$!

echo "Waiting for services to initialize..."
sleep 8

echo "[3/3] Starting Apex Capital (Agent A) on Port 3001..."
echo "Follow the negotiation: http://localhost:5173/demo"
echo "---------------------------------------------------------"

# Start Agent A in foreground
(cd demo && npm run agent-a)

# Cleanup on exit
kill $B_PID
kill $WEB_PID
