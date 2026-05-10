import { Keypair, PublicKey } from "@solana/web3.js";
import { Channel } from "./channel";
import { RegistryAdapter } from "./registry";
import { SignalingAdapter } from "./signaling";
import { SessionManager } from "./session-manager";
export declare class ConnectionTimeoutError extends Error {
    constructor(message: string);
}
export declare class ConnectionRejectedError extends Error {
    constructor(message: string);
}
interface SynapseOptions {
    profile: string;
    keypair?: Keypair;
    secretKey?: string;
    registry?: RegistryAdapter;
    signaling?: SignalingAdapter;
    maxConcurrent?: number;
    accept?: string[];
    network?: string;
    onTransaction?: (signature: string, description: string) => void;
}
type ConnectionHandler = (channel: Channel, from: string) => void | Promise<void>;
export declare class Synapse {
    readonly profile: string;
    readonly keypair: Keypair;
    readonly sessions: SessionManager;
    private readonly registry;
    private readonly signaling;
    private connectionHandler?;
    private onTransaction?;
    constructor(options: SynapseOptions);
    register(alias: string, options?: {
        category?: string;
        capabilities?: string[];
    }): Promise<void>;
    setAcceptList(list: string[]): Promise<void>;
    publish(metadata: {
        category?: string;
        capabilities?: string[];
    }): Promise<void>;
    discover(filters: {
        category?: string;
        capabilities?: string[];
    }): Promise<any[]>;
    onConnection(handler: ConnectionHandler): void;
    private startListening;
    connect(target: string | PublicKey): Promise<Channel>;
    acceptSession(sessionPDAStr: string): Promise<Channel>;
}
export { Channel } from "./channel";
export { generateKeypair, loadKeypair, saveKeypair } from "./keypair";
export { RegistryAdapter, SolanaRegistryAdapter } from "./registry";
export { SolanaSignalingAdapter, SessionRecord } from "./signaling";
export { SessionManager, ManagedSession } from "./session-manager";
export { completeConnection, createAnswer, createOffer } from "./webrtc";
export { default as IDL } from "./idl.json";
