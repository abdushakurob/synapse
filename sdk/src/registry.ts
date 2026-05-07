import { PublicKey } from "@solana/web3.js";

export class AgentNotFoundError extends Error {
  constructor(alias: string) {
    super(`[Registry] Agent not found: ${alias}`);
    this.name = "AgentNotFoundError";
  }
}

export class AliasTakenError extends Error {
  constructor(alias: string) {
    super(`[Registry] Alias already registered: ${alias}`);
    this.name = "AliasTakenError";
  }
}

export interface RegistryAdapter {
  register(alias: string, owner: PublicKey): Promise<void>;
  resolve(alias: string): Promise<PublicKey>;
}

/**
 * Minimal in-memory registry to unblock SDK milestone integration.
 * Replace adapter with on-chain implementation during contract integration.
 */
export class InMemoryRegistryAdapter implements RegistryAdapter {
  private readonly entries: Map<string, PublicKey> = new Map();

  async register(alias: string, owner: PublicKey): Promise<void> {
    if (this.entries.has(alias)) {
      throw new AliasTakenError(alias);
    }
    this.entries.set(alias, owner);
  }

  async resolve(alias: string): Promise<PublicKey> {
    const value = this.entries.get(alias);
    if (!value) {
      throw new AgentNotFoundError(alias);
    }
    return value;
  }
}
