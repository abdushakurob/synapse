import { PublicKey, Keypair } from "@solana/web3.js";
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

  async register(alias: string, category: string = "general", capabilities: string[] = []): Promise<string> {
    // For local file testing, we just update the metadata if the owner is already set
    // via setOwner() in the test script.
    const data = this.read();
    if (!data[alias]) {
      // If not set, generate a random but ON-CURVE pubkey
      data[alias] = JSON.stringify({
        owner: Keypair.generate().publicKey.toBase58(),
        category,
        capabilities
      });
    } else {
      const entry = JSON.parse(data[alias]);
      entry.category = category;
      entry.capabilities = capabilities;
      data[alias] = JSON.stringify(entry);
    }
    writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    return "local_file_sig_" + Math.random().toString(36).substring(7);
  }

  // Test-only method to link alias to a specific keypair
  setOwner(alias: string, owner: PublicKey) {
    const data = this.read();
    data[alias] = JSON.stringify({
      owner: owner.toBase58(),
      category: "general",
      capabilities: []
    });
    writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async resolve(alias: string): Promise<PublicKey> {
    const data = this.read();
    const entry = data[alias];
    if (!entry) throw new Error(`Alias not found: ${alias}`);
    const { owner } = JSON.parse(entry);
    return new PublicKey(owner);
  }

  async configure(options: any): Promise<string> {
    return "local_file_sig_" + Math.random().toString(36).substring(7);
  }

  async discover(filters: { category?: string; capabilities?: string[] }): Promise<any[]> {
    const data = this.read();
    return Object.keys(data).map(alias => {
      const entry = JSON.parse(data[alias]);
      return {
        alias,
        owner: new PublicKey(entry.owner),
        category: entry.category,
        capabilities: entry.capabilities,
        isOpen: true
      };
    }).filter(a => {
      if (filters.category && a.category !== filters.category) return false;
      if (filters.capabilities) {
        return filters.capabilities.every(c => a.capabilities.includes(c));
      }
      return true;
    });
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

  async createSession(initiator: PublicKey, responder: PublicKey, encryptedOffer: Uint8Array, responderAlias: string): Promise<{ record: SessionRecord; signature: string }> {
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
    return { record, signature: "local_file_sig_" + Math.random().toString(36).substring(7) };
  }

  onNewSession(responder: PublicKey, callback: (session: SessionRecord) => void): void {
    const responderStr = responder.toBase58();
    const seen = new Set<string>();

    // Initial poll to clear existing
    const initialData = this.read();
    Object.keys(initialData).forEach(k => seen.add(k));

    // Polling loop
    setInterval(() => {
      const data = this.read();
      Object.keys(data).forEach(key => {
        if (!seen.has(key)) {
          const record = this.parseRecord(data[key]);
          if (record.responder.toBase58() === responderStr && record.status === "pending") {
            seen.add(key);
            callback(record);
          }
        }
      });
    }, 1000);
  }


  async respondToSession(sessionPDA: PublicKey, encryptedAnswer: Uint8Array): Promise<string> {
    const data = this.read();
    const record = data[sessionPDA.toBase58()];
    if (!record) throw new Error("Session not found");
    record.encryptedAnswer = Array.from(encryptedAnswer);
    record.status = "active";
    this.write(data);
    return "local_file_sig_" + Math.random().toString(36).substring(7);
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
