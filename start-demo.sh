#!/bin/bash

# Exit on any error
set -e

# Kill any existing demo processes
pkill -f ts-node || true
pkill -f vite || true

echo "-----------------------------------------------------------"
echo "SYNAPSE PROTOCOL: AUTONOMOUS AGENT DEMO"
echo "-----------------------------------------------------------"

echo "[1/3] Preparing Environment..."
(cd sdk && npm run build)
(cd web && npm run dev) &
WEB_PID=$!

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
echo "[2/3] Starting Meridian Trading (Responder)..."
# Use a stable alias to avoid rent leakage and discovery errors
export AGENT_ALIAS="meridian-trading-dev-stable"
(cd demo && AGENT_ALIAS=$AGENT_ALIAS npm run agent-b 2>&1 | tee agent-b.log) &
B_PID=$!

echo ""
echo "Waiting for Agent B to boot and register on-chain ($AGENT_ALIAS)..."
sleep 15

# 4. Start Initiator (Agent A)
echo "[3/3] Starting Apex Capital (Initiator)..."
echo ""
echo "-----------------------------------------------------------"
echo "  Both agents are now autonomous."
echo "  Open the dashboards to watch live:"
echo ""
echo "  Apex Capital:     demo/agent-a/ui/index.html"
echo "  Meridian Trading: demo/agent-b/ui/index.html"
echo ""
echo "  Web dashboard:"
echo "  - http://localhost:8080/agent-a"
echo "  - http://localhost:8080/agent-b"
echo "-----------------------------------------------------------"
echo ""

# Start Agent A in foreground
cd demo && RESPONDER_ALIAS=$AGENT_ALIAS npm run agent-a

# Cleanup on exit
function cleanup {
  echo "Cleaning up..."
  kill $B_PID || true
  kill $WEB_PID || true
}
trap cleanup EXIT
