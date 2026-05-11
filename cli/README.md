# `@synapse-io/cli`

Synapse CLI for managing local identities and interacting with the devnet registry/signaling program.

## Profiles

Profiles are stored at:

- `~/.synapse/profiles/<profile>.json`

## Commands

### `synapse init`

Create a new profile (keypair) if it doesn’t exist.

### `synapse airdrop`

Request devnet SOL for a profile.

### `synapse balance`

Show devnet SOL balance.

### `synapse register <alias>`

Register an alias on-chain for the profile’s public key.

### `synapse whoami`

Show public key and (if registered) its on-chain alias.

### `synapse export-key`

Export the profile secret key for cloud deployment.

```bash
synapse export-key --profile default --format json
synapse export-key --profile default --format base58
```

### `synapse profiles`

List local profiles and show (best-effort) devnet balances + aliases.

### `synapse set-accept <aliases...>`

Update the profile’s on-chain accept list.

### `synapse publish`

Update the profile’s on-chain category/capabilities used for discovery.

