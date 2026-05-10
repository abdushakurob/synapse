import { PublicKey } from "@solana/web3.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { RegistryAdapter } from "./registry";
import { SignalingAdapter, SessionRecord } from "./signaling";

/**
 * File-based registry for local multi-process testing.
 */
export class FileRegistryAdapter implements RegistryAdapter {
  constructor(private filePath: string) {
    if (!existsSync(this.filePath)) {
      writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  private read(): Record<string, string> {
    return JSON.parse(readFileSync(this.filePath, "utf8"));
  }

  async register(alias: string, pubkey: PublicKey): Promise<void> {
    const data = this.read();
    data[alias] = pubkey.toBase58();
    writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async resolve(alias: string): Promise<PublicKey> {
    const data = this.read();
    const val = data[alias];
    if (!val) throw new Error(`Alias not found: ${alias}`);
    return new PublicKey(val);
  }
}

/**
 * File-based signaling for local multi-process testing.
 */
export class FileSignalingAdapter implements SignalingAdapter {
  constructor(private filePath: string) {
    if (!existsSync(this.filePath)) {
      writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  private read(): Record<string, any> {
    return JSON.parse(readFileSync(this.filePath, "utf8"));
  }

  private write(data: Record<string, any>) {
    writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array): Promise<SessionRecord> {
    const createdAt = Date.now();
    const [sessionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("session"), initiator.toBuffer(), responder.toBuffer(), Buffer.from(createdAt.toString())],
      new PublicKey("eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG")
    );

    const record: SessionRecord = {
      sessionPDA,
      initiator,
      responder,
      encryptedOffer: Array.from(encryptedOffer) as any, // Serialize for JSON
      status: "pending",
      createdAt,
      expiresAt: createdAt + 5 * 60 * 1000,
    };

    const data = this.read();
    data[sessionPDA.toBase58()] = record;
    this.write(data);
    return record;
  }

  async respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<void> {
    const data = this.read();
    const record = data[sessionPDA.toBase58()];
    if (!record) throw new Error("Session not found");
    record.encryptedAnswer = Array.from(encryptedAnswer);
    record.status = "active";
    this.write(data);
  }

  async waitForAnswer(sessionPDA: PublicKey, timeoutMs = 30000): Promise<Uint8Array> {
    const deadline = Date.now() + timeoutMs;
    const key = sessionPDA.toBase58();
    while (Date.now() < deadline) {
      const data = this.read();
      const record = data[key];
      if (record?.encryptedAnswer) {
        return Uint8Array.from(record.encryptedAnswer);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error("Timeout waiting for answer");
  }

  async getSession(sessionPDA: PublicKey): Promise<SessionRecord | undefined> {
    const data = this.read();
    const record = data[sessionPDA.toBase58()];
    if (!record) return undefined;
    return this.parseRecord(record);
  }

  private parseRecord(record: any): SessionRecord {
    return {
      ...record,
      sessionPDA: new PublicKey(record.sessionPDA),
      initiator: new PublicKey(record.initiator),
      responder: new PublicKey(record.responder),
      encryptedOffer: Uint8Array.from(record.encryptedOffer),
      encryptedAnswer: record.encryptedAnswer ? Uint8Array.from(record.encryptedAnswer) : undefined,
    };
  }

  async listSessions(responder: PublicKey): Promise<SessionRecord[]> {
    const data = this.read();
    const responderStr = responder.toBase58();
    return Object.values(data)
      .map(r => this.parseRecord(r))
      .filter(r => r.responder.toBase58() === responderStr);
  }
}
