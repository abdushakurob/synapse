import { PublicKey } from "@solana/web3.js";
import { Program, Idl, BN } from "@coral-xyz/anchor";
import idl from "./idl.json";
import { ConnectionTimeoutError } from "./errors";

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
  createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array, responderAlias: string): Promise<{ record: SessionRecord; signature: string }>;
  respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string>;
  waitForAnswer(sessionPDA: PublicKey, timeoutMs?: number): Promise<Uint8Array>;
  getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined>;
  listSessions(responder: PublicKey): Promise<SessionRecord[]>;
  closeSession(sessionPDA: PublicKey): Promise<string>;
  onNewSession?(responder: PublicKey, callback: (session: SessionRecord) => void): void;
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
  ): Promise<{ record: SessionRecord; signature: string }> {
    const createdAt = Date.now();
    const [sessionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("session"),
        initiator.toBuffer(),
        responder.toBuffer(),
        Buffer.from(createdAt.toString()),
      ],
      new PublicKey("eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG"),
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
    return { record, signature: "local_dummy_sig_" + Math.random().toString(36).substring(7) };
  }

  async respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string> {
    const key = sessionPDA.toBase58();
    const existing = this.sessions.get(key);
    if (!existing) {
      throw new Error(`[Signaling] Session not found: ${key}`);
    }
    existing.encryptedAnswer = encryptedAnswer;
    existing.status = "active";
    return "local_dummy_sig_" + Math.random().toString(36).substring(7);
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
  
  async getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined> {
    return this.sessions.get(sessionPDA.toBase58());
  }

  async listSessions(responder: PublicKey): Promise<SessionRecord[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.responder.equals(responder) && s.status === "pending"
    );
  }

  async closeSession(sessionPDA: PublicKey): Promise<string> {
    this.sessions.delete(sessionPDA.toBase58());
    return "local_dummy_sig_" + Math.random().toString(36).substring(7);
  }
}

/**
 * On-chain signaling adapter using Solana Session PDAs.
 */
export class SolanaSignalingAdapter implements SignalingAdapter {
  constructor(private program: Program<any>) {}

  async createSession(
    initiator: PublicKey,
    responder: PublicKey,
    encryptedOffer: Uint8Array,
    responderAlias: string
  ): Promise<{ record: SessionRecord; signature: string }> {
    const timestampSeconds = Math.floor(Date.now() / 1000);
    const tsBN = new BN(timestampSeconds);
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigUint64LE(BigInt(timestampSeconds));

    const [sessionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("session"),
        initiator.toBuffer(),
        responder.toBuffer(),
        timestampBuffer,
      ],
      this.program.programId
    );

    // Get the responder registry PDA for the firewall check
    const [responderRegistryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(responderAlias)],
      this.program.programId
    );

    let signature = "";
    try {
      signature = await (this.program.methods as any)
        .createSession(tsBN, Buffer.from(encryptedOffer), responderAlias)
        .accounts({
          session: sessionPDA,
          initiator: initiator,
          responder: responder,
          responder_registry: responderRegistryPDA,
        })
        .rpc();
    } catch (err: any) {
       console.error(`[Signaling] createSession RPC failed: ${err.message}`);
       throw err;
    }

    const record = await this.getSession(sessionPDA);
    if (!record) throw new Error("Failed to create session on-chain");
    return { record, signature };
  }

  async respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string> {
    const signature = await (this.program.methods as any)
      .respondSession(Buffer.from(encryptedAnswer))
      .accounts({
        session: sessionPDA,
        responder: this.program.provider.publicKey,
      })
      .rpc();
    return signature;
  }

  async closeSession(sessionPDA: PublicKey): Promise<string> {
    const signature = await (this.program.methods as any)
      .closeSession()
      .accounts({
        session: sessionPDA,
        initiator: this.program.provider.publicKey,
      })
      .rpc();
    return signature;
  }

  async waitForAnswer(sessionPDA: PublicKey, timeoutMs = 30000): Promise<Uint8Array> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const record = await this.getSession(sessionPDA);
      if (record?.encryptedAnswer) {
        return record.encryptedAnswer;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new ConnectionTimeoutError(`[Signaling] Timeout waiting for answer on-chain for ${sessionPDA.toBase58()}`);
  }

  async getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined> {
    try {
      const account = (await (this.program.account as any).session.fetch(sessionPDA)) as any;
      return this.mapAccountToRecord(sessionPDA, account);
    } catch {
      return undefined;
    }
  }

  /**
   * Listens for new sessions where the current agent is the responder.
   * This uses Solana WebSockets for real-time, push-based detection.
   */
  onNewSession(responder: PublicKey, callback: (session: SessionRecord) => void): void {
    const connection = this.program.provider.connection;
    const programId = this.program.programId;

    console.log(`[Signaling] Subscribing to sessions for responder: ${responder.toBase58()}`);

    connection.onProgramAccountChange(
      programId,
      (updatedAccountInfo) => {
        try {
          // Decode the account using Anchor
          const decoded = (this.program.coder.accounts as any).decode("session", updatedAccountInfo.accountInfo.data);
          const record = this.mapAccountToRecord(updatedAccountInfo.accountId, decoded);
          
          if (record.responder.equals(responder) && record.status === "pending") {
            callback(record);
          }
        } catch (err) {
          // Not a session account or failed to decode
          console.error("[Signaling] Error decoding session update:", err);
        }
      },
      "confirmed",
      [
        {
          memcmp: {
            offset: 8 + 32, // Offset of responder field
            bytes: responder.toBase58(),
          },
        },
      ]
    );
  }

  async listSessions(responder: PublicKey): Promise<SessionRecord[]> {
    try {
      // Still provide a one-time list for startup synchronization
      const accounts = await (this.program.account as any).session.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: responder.toBase58(),
          },
        },
      ]);

      return accounts
        .map((acc: any) => this.mapAccountToRecord(acc.publicKey, acc.account))
        .filter((rec: SessionRecord) => rec.status === "pending");
    } catch (err) {
      return [];
    }
  }

  private mapAccountToRecord(sessionPDA: PublicKey, account: any): SessionRecord {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
