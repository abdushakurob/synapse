"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaRegistryAdapter = exports.AliasTakenError = exports.AgentNotFoundError = void 0;
const web3_js_1 = require("@solana/web3.js");
class AgentNotFoundError extends Error {
    constructor(alias) {
        super(`[Registry] Agent not found: ${alias}`);
        this.name = "AgentNotFoundError";
    }
}
exports.AgentNotFoundError = AgentNotFoundError;
class AliasTakenError extends Error {
    constructor(alias) {
        super(`[Registry] Alias already registered: ${alias}`);
        this.name = "AliasTakenError";
    }
}
exports.AliasTakenError = AliasTakenError;
/**
 * On-chain registry adapter using Solana PDAs.
 */
class SolanaRegistryAdapter {
    constructor(program) {
        this.program = program;
    }
    async getPDA(alias) {
        const [pda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("agent"), Buffer.from(alias)], this.program.programId);
        return pda;
    }
    async register(alias, category = "general", capabilities = []) {
        try {
            const pda = await this.getPDA(alias);
            const signature = await this.program.methods
                .registerAgent(alias, category, capabilities)
                .accounts({
                agentRegistry: pda,
                owner: this.program.provider.publicKey,
            })
                .rpc();
            return signature;
        }
        catch (err) {
            if (err.message.includes("already in use")) {
                throw new AliasTakenError(alias);
            }
            throw err;
        }
    }
    async configure(options) {
        // We need the alias to find the registry. For now, let's assume we find it by scanning the user's accounts
        // or passing it in. A better way is to have the SDK track the registered alias.
        const alias = await this.getAliasForOwner(this.program.provider.publicKey);
        const pda = await this.getPDA(alias);
        return await this.program.methods
            .configureAgent(options.acceptList, options.isOpen, options.category || null, options.capabilities || null)
            .accounts({
            agentRegistry: pda,
            owner: this.program.provider.publicKey,
        })
            .rpc();
    }
    async discover(filters) {
        const memcmpFilters = [];
        if (filters.category) {
            // category starts at offset 8 (discriminator) + 4 (alias string len) + 32 (alias) + 32 (owner)
            // Wait, Anchor account layout is complex. Let's use fetchAll and filter for now.
            // In production, we'd use optimized gPA filters.
        }
        const accounts = await this.program.account.agentRegistry.all();
        return accounts
            .map((a) => ({
            alias: a.account.alias,
            owner: a.account.owner,
            category: a.account.category,
            capabilities: a.account.capabilities,
            isOpen: a.account.isOpen,
        }))
            .filter((a) => {
            if (filters.category && a.category !== filters.category)
                return false;
            if (filters.capabilities) {
                return filters.capabilities.every(c => a.capabilities.includes(c));
            }
            return true;
        });
    }
    async resolve(alias) {
        try {
            const pda = await this.getPDA(alias);
            const account = await this.program.account.agentRegistry.fetch(pda);
            return account.owner;
        }
        catch (err) {
            throw new AgentNotFoundError(alias);
        }
    }
    async getAliasForOwner(owner) {
        const accounts = await this.program.account.agentRegistry.all([
            { memcmp: { offset: 8 + 4 + 32, bytes: owner.toBase58() } }
        ]);
        if (accounts.length === 0)
            throw new Error("No agent registered for this owner");
        return accounts[0].account.alias;
    }
}
exports.SolanaRegistryAdapter = SolanaRegistryAdapter;
