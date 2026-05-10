import { PublicKey } from "@solana/web3.js";
import { Program, Idl } from "@coral-xyz/anchor";
import idl from "./idl.json";

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
  register(alias: string, owner: PublicKey): Promise<string | void>;
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

/**
 * On-chain registry adapter using Solana PDAs.
 */
export class SolanaRegistryAdapter implements RegistryAdapter {
  constructor(private program: Program<any>) {}

  private async getPDA(alias: string): Promise<PublicKey> {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(alias)],
      this.program.programId
    );
    return pda;
  }

  async register(alias: string): Promise<string | void> {
    try {
      const pda = await this.getPDA(alias);
      const signature = await (this.program.methods as any)
        .registerAgent(alias)
        .accounts({
          agentRegistry: pda,
          owner: this.program.provider.publicKey,
        })
        .rpc();
      return signature;
    } catch (err: any) {
      if (err.message.includes("already in use")) {
        throw new AliasTakenError(alias);
      }
      throw err;
    }
  }

  async resolve(alias: string): Promise<PublicKey> {
    try {
      const pda = await this.getPDA(alias);
      const account = await (this.program.account as any).agentRegistry.fetch(pda);
      return (account as any).owner;
    } catch (err: any) {
      throw new AgentNotFoundError(alias);
    }
  }
}
