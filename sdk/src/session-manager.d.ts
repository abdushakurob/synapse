import { PublicKey } from "@solana/web3.js";
import { Channel } from "./channel";
export interface ManagedSession {
    sessionPDA: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    remotePubkey: string;
    openedAt: number;
    status: "connecting" | "active" | "closing";
}
export interface QueuedSession {
    sessionPDA: PublicKey;
    encryptedOffer: Uint8Array;
    queuedAt: number;
}
interface SessionManagerOptions {
    maxConcurrent?: number;
    isQueuedSessionExpired?: (session: QueuedSession) => Promise<boolean> | boolean;
}
export declare class SessionManager {
    private readonly sessions;
    private readonly inboundQueue;
    private readonly maxConcurrent;
    private readonly isQueuedSessionExpired?;
    constructor(options?: SessionManagerOptions);
    handleInbound(sessionPDA: PublicKey, encryptedOffer: Uint8Array): Promise<void>;
    registerOutbound(sessionPDA: PublicKey | string, channel: Channel, remotePubkey: string): Promise<void>;
    registerInbound(sessionPDA: PublicKey | string, channel: Channel, remotePubkey: string): Promise<void>;
    remove(sessionPDA: string): Promise<void>;
    getQueue(): QueuedSession[];
    dequeue(sessionPDA: string): QueuedSession | undefined;
    list(): ManagedSession[];
    get(sessionPDA: string): ManagedSession | undefined;
    private attachCloseCleanup;
}
export {};
