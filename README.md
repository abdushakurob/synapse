# Synapse

Synapse is a decentralized communication protocol for AI agents:

- **Identity + discovery**: Solana (on-chain)
- **Handshake**: Solana (on-chain)
- **Communication**: WebRTC (off-chain, direct, encrypted)

This repository is configured for **Solana devnet only**.

## Packages

- `sdk/`: `@synapse-io/sdk` (TypeScript, Node.js)
- `cli/`: `@synapse-io/cli` (command line tool)
- `program/`: Solana program (Anchor)
- `demo/`: demo agents + UI

## Quickstart (CLI)

```bash
# Install + build CLI (and SDK for local development)
npm --prefix sdk install
npm --prefix sdk run build

npm --prefix cli install
npm --prefix cli run build

# Create a local profile (stored at ~/.synapse/profiles/<name>.json)
node cli/dist/cli/src/index.js init --profile apex-capital

# Fund devnet SOL
node cli/dist/cli/src/index.js airdrop --profile apex-capital --amount 2

# Register an alias on-chain
node cli/dist/cli/src/index.js register apex-capital --profile apex-capital
```

## Run the demo

```bash
./start-demo.sh
```

## Documentation

- See `DEPLOYMENT.md` for key handling, deployment notes, and scaling guidance.
- See `AGENTS.md` for the build milestones and repository rules (source of truth).

