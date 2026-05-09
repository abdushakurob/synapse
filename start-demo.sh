#!/bin/bash

# Kill any existing demo processes
pkill -f ts-node || true

# Clean up old session files
rm -f .tmp/registry.json .tmp/signaling.json
mkdir -p .tmp
echo "{}" > .tmp/registry.json
echo "{}" > .tmp/signaling.json

echo "Starting Meridian Trading (Agent B)..."
cd demo && npm run agent-b > agent-b.log 2>&1 &
B_PID=$!

echo "Waiting for Agent B to register..."
sleep 3

echo "Starting Apex Capital (Agent A)..."
cd demo && npm run agent-a

# Cleanup on exit
kill $B_PID
