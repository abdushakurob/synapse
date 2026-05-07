#!/bin/bash
echo "Installing Solana..."
curl -sSfL https://release.solana.com/v1.18.18/install | sh
export PATH="/home/aob/.local/share/solana/install/active_release/bin:$PATH"

echo "Installing Anchor via AVM..."
source ~/.cargo/env
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
~/.cargo/bin/avm install 0.29.0
~/.cargo/bin/avm use 0.29.0

echo "Done."
