import { PublicKey } from "@solana/web3.js";

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
  createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array): Promise<SessionRecord>;
  respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<void>;
  waitForAnswer(sessionPDA: PublicKey, timeoutMs?: number): Promise<Uint8Array>;
}

/**
 * In-memory signaling adapter for local SDK iteration.
 * The public SDK API matches planned on-chain behavior.
 */
export class InMemorySignalingAdapter implements SignalingAdapter {
  private readonly sessions: Map<string, SessionRecord> = new Map();

  async createSession(
    initiator: PublicKey,
    responder: PublicKey,
    encryptedOffer: Uint8Array,
  ): Promise<SessionRecord> {
    const createdAt = Date.now();
    const seed = `${initiator.toBase58()}-${responder.toBase58()}-${createdAt}`;
    const [sessionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("session"), Buffer.from(seed)],
      initiator,
    );

    const record: SessionRecord = {
      sessionPDA,
      initiator,
      responder,
      encryptedOffer,
      status: "pending",
      createdAt,
      expiresAt: createdAt + 5 * 60 * 1000,
    };
    this.sessions.set(sessionPDA.toBase58(), record);
    return record;
  }

  async respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<void> {
    const key = sessionPDA.toBase58();
    const existing = this.sessions.get(key);
    if (!existing) {
      throw new Error(`[Signaling] Session not found: ${key}`);
    }
    existing.encryptedAnswer = encryptedAnswer;
    existing.status = "active";
  }

  async waitForAnswer(sessionPDA: PublicKey, timeoutMs = 30_000): Promise<Uint8Array> {
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
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
