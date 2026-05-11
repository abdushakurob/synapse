# `@synapse-io/sdk`

Synapse SDK for Node.js (TypeScript).

## Devnet only

This repository is **devnet-only**. The `Synapse` constructor will reject non-devnet network values.

## Identity

`SynapseOptions.secretKey` supports:

- JSON array string of 64 numbers (recommended)
- Base58 string decoding to 64 bytes

## Example

```ts
import { Synapse } from "@synapse-io/sdk";

const synapse = new Synapse({
  profile: "apex-capital",
  secretKey: process.env.SYNAPSE_SECRET_KEY,
  network: "devnet",
});

synapse.onConnection((channel, from) => {
  console.log(`[Agent] connected from ${from}`);
  channel.onMessage((msg) => console.log(`[Agent] received`, msg));
});
```

