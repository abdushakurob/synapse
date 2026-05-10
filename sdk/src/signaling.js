"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaSignalingAdapter = exports.InMemorySignalingAdapter = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
/**
 * In-memory signaling adapter for local SDK iteration.
 * The public SDK API matches planned on-chain behavior.
 */
class InMemorySignalingAdapter {
    constructor() {
        this.sessions = new Map();
    }
    async createSession(initiator, responder, encryptedOffer) {
        const createdAt = Date.now();
        const [sessionPDA] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("session"),
            initiator.toBuffer(),
            responder.toBuffer(),
            Buffer.from(createdAt.toString()),
        ], new web3_js_1.PublicKey("eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG"));
        const record = {
            sessionPDA,
            initiator,
            responder,
            encryptedOffer,
            status: "pending",
            createdAt,
            expiresAt: createdAt + 5 * 60 * 1000,
        };
        this.sessions.set(sessionPDA.toBase58(), record);
        return { record, signature: "local_dummy_sig_" + Math.random().toString(36).substring(7) };
    }
    async respondToSession(sessionPDA, encryptedAnswer) {
        const key = sessionPDA.toBase58();
        const existing = this.sessions.get(key);
        if (!existing) {
            throw new Error(`[Signaling] Session not found: ${key}`);
        }
        existing.encryptedAnswer = encryptedAnswer;
        existing.status = "active";
        return "local_dummy_sig_" + Math.random().toString(36).substring(7);
    }
    async waitForAnswer(sessionPDA, timeoutMs = 30000) {
        const deadline = Date.now() + timeoutMs;
        const key = sessionPDA.toBase58();
        while (Date.now() < deadline) {
            const record = this.sessions.get(key);
            if (record?.encryptedAnswer) {
                return record.encryptedAnswer;
            }
            await sleep(250);
        }
        throw new Error(`[Signaling] Timeout waiting for answer on ${key}`);
    }
    async getSession(sessionPDA) {
        return this.sessions.get(sessionPDA.toBase58());
    }
    async listSessions(responder) {
        return Array.from(this.sessions.values()).filter((s) => s.responder.equals(responder) && s.status === "pending");
    }
}
exports.InMemorySignalingAdapter = InMemorySignalingAdapter;
/**
 * On-chain signaling adapter using Solana Session PDAs.
 */
class SolanaSignalingAdapter {
    constructor(program) {
        this.program = program;
    }
    async createSession(initiator, responder, encryptedOffer, responderAlias) {
        const timestampSeconds = Math.floor(Date.now() / 1000);
        const tsBN = new anchor_1.BN(timestampSeconds);
        const timestampBuffer = Buffer.alloc(8);
        timestampBuffer.writeBigUint64LE(BigInt(timestampSeconds));
        const [sessionPDA] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("session"),
            initiator.toBuffer(),
            responder.toBuffer(),
            timestampBuffer,
        ], this.program.programId);
        // Get the responder registry PDA for the firewall check
        const [responderRegistryPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("agent"), Buffer.from(responderAlias)], this.program.programId);
        let signature = "";
        try {
            signature = await this.program.methods
                .createSession(tsBN, Buffer.from(encryptedOffer), responderAlias)
                .accounts({
                session: sessionPDA,
                initiator: initiator,
                responder: responder,
                responderRegistry: responderRegistryPDA,
            })
                .rpc();
        }
        catch (err) {
            console.error(`[Signaling] createSession RPC failed: ${err.message}`);
            throw err;
        }
        const record = await this.getSession(sessionPDA);
        if (!record)
            throw new Error("Failed to create session on-chain");
        return { record, signature };
    }
    async respondToSession(sessionPDA, encryptedAnswer) {
        const signature = await this.program.methods
            .respondSession(Buffer.from(encryptedAnswer))
            .accounts({
            session: sessionPDA,
            responder: this.program.provider.publicKey,
        })
            .rpc();
        return signature;
    }
    async waitForAnswer(sessionPDA, timeoutMs = 30000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const record = await this.getSession(sessionPDA);
            if (record?.encryptedAnswer) {
                return record.encryptedAnswer;
            }
            await new Promise((r) => setTimeout(r, 2000));
        }
        throw new Error(`Timeout waiting for answer on-chain for ${sessionPDA.toBase58()}`);
    }
    async getSession(sessionPDA) {
        try {
            const account = (await this.program.account.session.fetch(sessionPDA));
            return this.mapAccountToRecord(sessionPDA, account);
        }
        catch {
            return undefined;
        }
    }
    /**
     * Listens for new sessions where the current agent is the responder.
     * This uses Solana WebSockets for real-time, push-based detection.
     */
    onNewSession(responder, callback) {
        const connection = this.program.provider.connection;
        const programId = this.program.programId;
        console.log(`[Signaling] Subscribing to sessions for responder: ${responder.toBase58()}`);
        connection.onProgramAccountChange(programId, (updatedAccountInfo) => {
            try {
                // Decode the account using Anchor
                const decoded = this.program.coder.accounts.decode("session", updatedAccountInfo.accountInfo.data);
                const record = this.mapAccountToRecord(updatedAccountInfo.accountId, decoded);
                if (record.responder.equals(responder) && record.status === "pending") {
                    callback(record);
                }
            }
            catch (err) {
                // Not a session account or failed to decode
                console.error("[Signaling] Error decoding session update:", err);
            }
        }, "confirmed", [
            {
                memcmp: {
                    offset: 8 + 32, // Offset of responder field
                    bytes: responder.toBase58(),
                },
            },
        ]);
    }
    async listSessions(responder) {
        try {
            // Still provide a one-time list for startup synchronization
            const accounts = await this.program.account.session.all([
                {
                    memcmp: {
                        offset: 8 + 32,
                        bytes: responder.toBase58(),
                    },
                },
            ]);
            return accounts
                .map((acc) => this.mapAccountToRecord(acc.publicKey, acc.account))
                .filter((rec) => rec.status === "pending");
        }
        catch (err) {
            return [];
        }
    }
    mapAccountToRecord(sessionPDA, account) {
        return {
            sessionPDA,
            initiator: account.initiator,
            responder: account.responder,
            encryptedOffer: Uint8Array.from(account.encryptedOffer),
            encryptedAnswer: account.encryptedAnswer
                ? Uint8Array.from(account.encryptedAnswer)
                : undefined,
            status: account.status.pending ? "pending" : account.status.active ? "active" : "closed",
            createdAt: account.createdAt.toNumber(),
            expiresAt: account.expiresAt.toNumber(),
        };
    }
}
exports.SolanaSignalingAdapter = SolanaSignalingAdapter;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
