import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
export interface SessionRecord {
    sessionPDA: PublicKey;
    initiator: PublicKey;
    responder: PublicKey;
    encryptedOffer: Uint8Array;
    encryptedAnswer?: Uint8Array;
    status: "pending" | "active" | "closed";
    createdAt: number;
    expiresAt: number;
}
export interface SignalingAdapter {
    createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array, responderAlias: string): Promise<{
        record: SessionRecord;
        signature: string;
    }>;
    respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string>;
    waitForAnswer(sessionPDA: PublicKey, timeoutMs?: number): Promise<Uint8Array>;
    getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined>;
    listSessions(responder: PublicKey): Promise<SessionRecord[]>;
    onNewSession?(responder: PublicKey, callback: (session: SessionRecord) => void): void;
}
/**
 * In-memory signaling adapter for local SDK iteration.
 * The public SDK API matches planned on-chain behavior.
 */
export declare class InMemorySignalingAdapter implements SignalingAdapter {
    private readonly sessions;
    createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array): Promise<{
        record: SessionRecord;
        signature: string;
    }>;
    respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string>;
    waitForAnswer(sessionPDA: PublicKey, timeoutMs?: number): Promise<Uint8Array>;
    getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined>;
    listSessions(responder: PublicKey): Promise<SessionRecord[]>;
}
/**
 * On-chain signaling adapter using Solana Session PDAs.
 */
export declare class SolanaSignalingAdapter implements SignalingAdapter {
    private program;
    constructor(program: Program<any>);
    createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array, responderAlias: string): Promise<{
        record: SessionRecord;
        signature: string;
    }>;
    respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string>;
    waitForAnswer(sessionPDA: PublicKey, timeoutMs?: number): Promise<Uint8Array>;
    getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined>;
    /**
     * Listens for new sessions where the current agent is the responder.
     * This uses Solana WebSockets for real-time, push-based detection.
     */
    onNewSession(responder: PublicKey, callback: (session: SessionRecord) => void): void;
    listSessions(responder: PublicKey): Promise<SessionRecord[]>;
    private mapAccountToRecord;
}
