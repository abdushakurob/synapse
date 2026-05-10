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

export class SessionManager {
  private readonly sessions: Map<string, ManagedSession> = new Map();
  private readonly inboundQueue: QueuedSession[] = [];
  private readonly maxConcurrent: number;
  private readonly isQueuedSessionExpired?: SessionManagerOptions["isQueuedSessionExpired"];

  constructor(options: SessionManagerOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 10;
    this.isQueuedSessionExpired = options.isQueuedSessionExpired;
  }

  async handleInbound(sessionPDA: PublicKey, encryptedOffer: Uint8Array): Promise<void> {
    const queued: QueuedSession = {
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

  async registerOutbound(
    sessionPDA: PublicKey | string,
    channel: Channel,
    remotePubkey: string,
  ): Promise<void> {
    const key = toSessionKey(sessionPDA);
    const managed: ManagedSession = {
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

  async registerInbound(
    sessionPDA: PublicKey | string,
    channel: Channel,
    remotePubkey: string,
  ): Promise<void> {
    const key = toSessionKey(sessionPDA);
    const managed: ManagedSession = {
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

  async remove(sessionPDA: string): Promise<void> {
    const existing = this.sessions.get(sessionPDA);
    if (!existing) {
      return;
    }
    existing.status = "closing";
    this.sessions.delete(sessionPDA);
  }

  getQueue(): QueuedSession[] {
    return [...this.inboundQueue];
  }

  dequeue(sessionPDA: string): QueuedSession | undefined {
    const index = this.inboundQueue.findIndex(q => q.sessionPDA.toBase58() === sessionPDA);
    if (index !== -1) {
      return this.inboundQueue.splice(index, 1)[0];
    }
    return undefined;
  }

  list(): ManagedSession[] {
    return [...this.sessions.values()];
  }

  get(sessionPDA: string): ManagedSession | undefined {
    return this.sessions.get(sessionPDA);
  }

  private attachCloseCleanup(session: ManagedSession): void {
    session.channel.onClose(() => {
      void this.remove(session.sessionPDA);
    });
  }
}

function toSessionKey(sessionPDA: PublicKey | string): string {
  return typeof sessionPDA === "string" ? sessionPDA : sessionPDA.toBase58();
}
