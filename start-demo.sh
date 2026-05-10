#!/bin/bash

# Exit on any error
set -e

# Kill any existing demo processes
pkill -f ts-node || true
pkill -f vite || true

echo "---------------------------------------------------------"
echo "🚀 SYNAPSE PROTOCOL: DECENTRALIZED TRADING DEMO"
echo "---------------------------------------------------------"

# 1. Build and Link SDK
echo "[1/4] Preparing SDK and CLI..."
(cd sdk && npm run build)
(cd cli && npm run build)

# 2. Setup Identities
if [ ! -f "dev-wallet-a.json" ]; then
  echo "Generating Identity for Apex Capital (Agent A)..."
  solana-keygen new --no-passphrase -o dev-wallet-a.json -q
  solana airdrop 1 -u devnet -k dev-wallet-a.json || echo "Airdrop failed, hopefully you have balance."
fi

if [ ! -f "dev-wallet-b.json" ]; then
  echo "Generating Identity for Meridian Trading (Agent B)..."
  solana-keygen new --no-passphrase -o dev-wallet-b.json -q
  solana airdrop 1 -u devnet -k dev-wallet-b.json || echo "Airdrop failed, hopefully you have balance."
fi

# 3. Start Responder (Agent B)
echo "[2/4] Starting Meridian Trading (Responder) on Port 3002..."
(cd demo && npm run agent-b > agent-b.log 2>&1) &
B_PID=$!

# 4. Start Web Dashboard
echo "[3/4] Starting Web Control Center..."
(cd web && npm run dev > web.log 2>&1) &
WEB_PID=$!

echo "Waiting for agents to synchronize with Solana Devnet..."
sleep 10

# 5. Start Initiator (Agent A)
echo "[4/4] Starting Apex Capital (Initiator) on Port 3001..."
echo ""
echo "👉 OPEN THE DASHBOARD: http://localhost:5173/agent-a"
echo "👉 OPEN THE RESPONDER: http://localhost:5173/agent-b"
echo ""
echo "Press 'Initiate Connection' on the Apex Capital dashboard to start."
echo "---------------------------------------------------------"

# Start Agent A in foreground
cd demo && npm run agent-a

# Cleanup on exit
function cleanup {
  echo "Cleaning up..."
  kill $B_PID || true
  kill $WEB_PID || true
}
trap cleanup EXIT
