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
  register(alias: string, category: string, capabilities: string[]): Promise<string | void>;
  resolve(alias: string): Promise<PublicKey>;
  configure(options: {
    acceptList: PublicKey[];
    isOpen: boolean;
    category?: string;
    capabilities?: string[];
  }): Promise<string>;
  discover(filters: { category?: string; capabilities?: string[] }): Promise<any[]>;
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

  async register(alias: string, category: string = "general", capabilities: string[] = []): Promise<string | void> {
    try {
      const pda = await this.getPDA(alias);
      const signature = await (this.program.methods as any)
        .registerAgent(alias, category, capabilities)
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

  async configure(options: {
    acceptList: PublicKey[];
    isOpen: boolean;
    category?: string;
    capabilities?: string[];
  }): Promise<string> {
    // We need the alias to find the registry. For now, let's assume we find it by scanning the user's accounts
    // or passing it in. A better way is to have the SDK track the registered alias.
    const alias = await this.getAliasForOwner(this.program.provider.publicKey as PublicKey);
    const pda = await this.getPDA(alias);
    
    return await (this.program.methods as any)
      .configureAgent(
        options.acceptList,
        options.isOpen,
        options.category || null,
        options.capabilities || null
      )
      .accounts({
        agentRegistry: pda,
        owner: this.program.provider.publicKey,
      })
      .rpc();
  }

  async discover(filters: { category?: string; capabilities?: string[] }): Promise<any[]> {
    const memcmpFilters: any[] = [];
    
    if (filters.category) {
      // category starts at offset 8 (discriminator) + 4 (alias string len) + 32 (alias) + 32 (owner)
      // Wait, Anchor account layout is complex. Let's use fetchAll and filter for now.
      // In production, we'd use optimized gPA filters.
    }

    const accounts = await (this.program.account as any).agentRegistry.all();
    return accounts
      .map((a: any) => ({
        alias: a.account.alias,
        owner: a.account.owner,
        category: a.account.category,
        capabilities: a.account.capabilities,
        isOpen: a.account.isOpen,
      }))
      .filter((a: any) => {
        if (filters.category && a.category !== filters.category) return false;
        if (filters.capabilities) {
          return filters.capabilities.every(c => a.capabilities.includes(c));
        }
        return true;
      });
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

  private async getAliasForOwner(owner: PublicKey): Promise<string> {
    const accounts = await (this.program.account as any).agentRegistry.all([
      { memcmp: { offset: 8 + 4 + 32, bytes: owner.toBase58() } }
    ]);
    if (accounts.length === 0) throw new Error("No agent registered for this owner");
    return accounts[0].account.alias;
  }
}
