"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
class SessionManager {
    constructor(options = {}) {
        this.sessions = new Map();
        this.inboundQueue = [];
        this.maxConcurrent = options.maxConcurrent ?? 10;
        this.isQueuedSessionExpired = options.isQueuedSessionExpired;
    }
    async handleInbound(sessionPDA, encryptedOffer) {
        const queued = {
            sessionPDA,
            encryptedOffer,
            queuedAt: Date.now(),
        };
        // Check if it's already in the queue or active sessions
        const key = sessionPDA.toBase58();
        if (this.sessions.has(key) || this.inboundQueue.some(q => q.sessionPDA.toBase58() === key)) {
            return;
        }
        this.inboundQueue.push(queued);
    }
    async registerOutbound(sessionPDA, channel, remotePubkey) {
        const key = toSessionKey(sessionPDA);
        const managed = {
            sessionPDA: key,
            channel,
            direction: "outbound",
            remotePubkey,
            openedAt: Date.now(),
            status: "active",
        };
        this.sessions.set(key, managed);
        this.attachCloseCleanup(managed);
    }
    async registerInbound(sessionPDA, channel, remotePubkey) {
        const key = toSessionKey(sessionPDA);
        const managed = {
            sessionPDA: key,
            channel,
            direction: "inbound",
            remotePubkey,
            openedAt: Date.now(),
            status: "active",
        };
        this.sessions.set(key, managed);
        this.attachCloseCleanup(managed);
    }
    async remove(sessionPDA) {
        const existing = this.sessions.get(sessionPDA);
        if (!existing) {
            return;
        }
        existing.status = "closing";
        this.sessions.delete(sessionPDA);
    }
    getQueue() {
        return [...this.inboundQueue];
    }
    dequeue(sessionPDA) {
        const index = this.inboundQueue.findIndex(q => q.sessionPDA.toBase58() === sessionPDA);
        if (index !== -1) {
            return this.inboundQueue.splice(index, 1)[0];
        }
        return undefined;
    }
    list() {
        return [...this.sessions.values()];
    }
    get(sessionPDA) {
        return this.sessions.get(sessionPDA);
    }
    attachCloseCleanup(session) {
        session.channel.onClose(() => {
            void this.remove(session.sessionPDA);
        });
    }
}
exports.SessionManager = SessionManager;
function toSessionKey(sessionPDA) {
    return typeof sessionPDA === "string" ? sessionPDA : sessionPDA.toBase58();
}
