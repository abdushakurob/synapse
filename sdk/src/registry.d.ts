import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
export declare class AgentNotFoundError extends Error {
    constructor(alias: string);
}
export declare class AliasTakenError extends Error {
    constructor(alias: string);
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
    discover(filters: {
        category?: string;
        capabilities?: string[];
    }): Promise<any[]>;
}
/**
 * On-chain registry adapter using Solana PDAs.
 */
export declare class SolanaRegistryAdapter implements RegistryAdapter {
    private program;
    constructor(program: Program<any>);
    private getPDA;
    register(alias: string, category?: string, capabilities?: string[]): Promise<string | void>;
    configure(options: {
        acceptList: PublicKey[];
        isOpen: boolean;
        category?: string;
        capabilities?: string[];
    }): Promise<string>;
    discover(filters: {
        category?: string;
        capabilities?: string[];
    }): Promise<any[]>;
    resolve(alias: string): Promise<PublicKey>;
    private getAliasForOwner;
}
