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
  processInbound: (session: QueuedSession) => Promise<ManagedSession | null>;
  isQueuedSessionExpired?: (session: QueuedSession) => Promise<boolean> | boolean;
}

export class SessionManager {
  private readonly sessions: Map<string, ManagedSession> = new Map();
  private readonly inboundQueue: QueuedSession[] = [];
  private readonly maxConcurrent: number;
  private readonly processInbound: SessionManagerOptions["processInbound"];
  private readonly isQueuedSessionExpired?: SessionManagerOptions["isQueuedSessionExpired"];

  constructor(options: SessionManagerOptions) {
    this.maxConcurrent = options.maxConcurrent ?? 10;
    this.processInbound = options.processInbound;
    this.isQueuedSessionExpired = options.isQueuedSessionExpired;
  }

  async handleInbound(sessionPDA: PublicKey, encryptedOffer: Uint8Array): Promise<void> {
    const queued: QueuedSession = {
      sessionPDA,
      encryptedOffer,
      queuedAt: Date.now(),
    };

    if (this.sessions.size >= this.maxConcurrent) {
      this.inboundQueue.push(queued);
      return;
    }

    await this.activateInbound(queued);
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

  async remove(sessionPDA: string): Promise<void> {
    const existing = this.sessions.get(sessionPDA);
    if (!existing) {
      return;
    }
    existing.status = "closing";
    this.sessions.delete(sessionPDA);
    await this.processQueue();
  }

  list(): ManagedSession[] {
    return [...this.sessions.values()];
  }

  get(sessionPDA: string): ManagedSession | undefined {
    return this.sessions.get(sessionPDA);
  }

  private async activateInbound(queued: QueuedSession): Promise<void> {
    const managed = await this.processInbound(queued);
    if (!managed) {
      return;
    }
    this.sessions.set(managed.sessionPDA, managed);
    this.attachCloseCleanup(managed);
  }

  private attachCloseCleanup(session: ManagedSession): void {
    session.channel.onClose(() => {
      void this.remove(session.sessionPDA);
    });
  }

  private async processQueue(): Promise<void> {
    while (this.sessions.size < this.maxConcurrent && this.inboundQueue.length > 0) {
      const next = this.inboundQueue.shift();
      if (!next) {
        return;
      }

      const expired = this.isQueuedSessionExpired ? await this.isQueuedSessionExpired(next) : false;
      if (expired) {
        continue;
      }

      await this.activateInbound(next);
    }
  }
}

function toSessionKey(sessionPDA: PublicKey | string): string {
  return typeof sessionPDA === "string" ? sessionPDA : sessionPDA.toBase58();
}
