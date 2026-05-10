import zlib from "zlib";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Channel } from "./channel";
import { decrypt, ed25519SecretToCurve25519, ed25519ToCurve25519, encrypt } from "./crypto";
import { InMemoryRegistryAdapter, RegistryAdapter, SolanaRegistryAdapter } from "./registry";
import { InMemorySignalingAdapter, SessionRecord, SignalingAdapter, SolanaSignalingAdapter } from "./signaling";
import { FileRegistryAdapter, FileSignalingAdapter } from "./file-adapters";
import { ManagedSession, SessionManager } from "./session-manager";
import { completeConnection, ConnectionData, createAnswer, createOffer } from "./webrtc";

export class ConnectionTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionTimeoutError";
  }
}

interface SynapseOptions {
  profile: string;
  keypair?: Keypair;
  registry?: RegistryAdapter;
  signaling?: SignalingAdapter;
  maxConcurrent?: number;
  onTransaction?: (signature: string, description: string) => void;
}

type ConnectionHandler = (channel: Channel, from: string) => void | Promise<void>;
type RequestHandler = (request: { sessionPDA: PublicKey, from: string }) => void | Promise<void>;

export class Synapse {
  readonly profile: string;
  readonly keypair: Keypair;
  readonly sessions: SessionManager;

  private readonly registry: RegistryAdapter;
  private readonly signaling: SignalingAdapter;
  private connectionHandler?: ConnectionHandler;
  private requestHandler?: RequestHandler;
  private onTransaction?: (signature: string, description: string) => void;

  constructor(options: SynapseOptions) {
    this.profile = options.profile;
    this.keypair = options.keypair ?? Keypair.generate();
    this.registry = options.registry ?? new InMemoryRegistryAdapter();
    this.signaling = options.signaling ?? new InMemorySignalingAdapter();
    this.onTransaction = options.onTransaction;

    this.sessions = new SessionManager({
      maxConcurrent: options.maxConcurrent ?? 10,
    });
  }

  async register(alias: string): Promise<void> {
    await this.registry.register(alias, this.keypair.publicKey);
  }

  onConnection(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
  }

  onRequest(handler: RequestHandler): void {
    this.requestHandler = handler;
    // For local testing or real blockchain events, start listening
    this.startPolling();
  }

  private async notifyRequest(sessionPDA: PublicKey, encryptedOffer: Uint8Array) {
    await this.sessions.handleInbound(sessionPDA, encryptedOffer);
    if (this.requestHandler) {
      const record = await this.signaling.getSession(sessionPDA);
      if (record) {
        await this.requestHandler({ sessionPDA, from: record.initiator.toBase58() });
      }
    }
  }

  private async startPolling() {
    console.log(`[${this.profile}] Starting session listener...`);

    // Use push-based notifications (WebSockets) if available
    if (this.signaling.onNewSession) {
      this.signaling.onNewSession(this.keypair.publicKey, (session) => {
        if (!this.sessions.get(session.sessionPDA.toBase58()) && !this.sessions.getQueue().some(q => q.sessionPDA.toBase58() === session.sessionPDA.toBase58())) {
          this.notifyRequest(session.sessionPDA, session.encryptedOffer);
        }
      });

      // Catch-up check for sessions that arrived before subscription
      const initial = await this.signaling.listSessions(this.keypair.publicKey);
      for (const session of initial) {
        if (!this.sessions.get(session.sessionPDA.toBase58()) && !this.sessions.getQueue().some(q => q.sessionPDA.toBase58() === session.sessionPDA.toBase58())) {
          await this.notifyRequest(session.sessionPDA, session.encryptedOffer);
        }
      }
      return;
    }

    // Fallback to polling for simpler adapters
    while (true) {
      try {
        const sessions = await (this.signaling as any).listSessions?.(this.keypair.publicKey);
        if (sessions) {
          for (const session of sessions) {
            if (!this.sessions.get(session.sessionPDA.toBase58()) && !this.sessions.getQueue().some(q => q.sessionPDA.toBase58() === session.sessionPDA.toBase58())) {
               await this.notifyRequest(session.sessionPDA, session.encryptedOffer);
            }
          }
        }
      } catch (err) {
        // Silently continue
      }
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  async connect(alias: string): Promise<Channel> {
    const responder = await this.registry.resolve(alias);
    const offer = await createOffer();
    const encryptedOffer = encryptConnectionData(offer.data, this.keypair, responder);

    const { record, signature } = await this.signaling.createSession(
      this.keypair.publicKey,
      responder,
      encryptedOffer,
    );

    if (this.onTransaction) {
      this.onTransaction(signature, `Created Session Account for ${alias}`);
    }

    let encryptedAnswer: Uint8Array;
    try {
      encryptedAnswer = await this.signaling.waitForAnswer(record.sessionPDA, 60000);
    } catch {
      throw new ConnectionTimeoutError("[SDK] Timed out waiting for responder answer (60s)");
    }

    const answer = decryptConnectionData(encryptedAnswer, this.keypair, responder);
    const peer = await completeConnection(offer.peer, answer);
    const channel = new Channel(peer);
    await this.sessions.registerOutbound(record.sessionPDA, channel, responder.toBase58());
    return channel;
  }

  /**
   * Accepts a pending inbound session request and opens the channel.
   */
  async acceptSession(sessionPDAStr: string): Promise<Channel> {
    const queued = this.sessions.dequeue(sessionPDAStr);
    if (!queued) {
      throw new Error(`[SDK] Session ${sessionPDAStr} not found in pending queue.`);
    }

    const record = await this.signaling.getSession(queued.sessionPDA);
    if (!record) {
      throw new Error(`[SDK] Session ${sessionPDAStr} not found on-chain.`);
    }

    const initiator = record.initiator;
    const offerData = decryptConnectionData(record.encryptedOffer, this.keypair, initiator);
    const answer = await createAnswer(offerData);
    const encryptedAnswer = encryptConnectionData(answer.data, this.keypair, initiator);
    const signature = await this.signaling.respondToSession(record.sessionPDA, encryptedAnswer);
    if (this.onTransaction) {
      this.onTransaction(signature, `Accepted Connection from ${record.initiator.toBase58()}`);
    }
    const channel = new Channel(answer.peer);

    await this.sessions.registerInbound(record.sessionPDA, channel, initiator.toBase58());
    if (this.connectionHandler) {
      await this.connectionHandler(channel, initiator.toBase58());
    }
    return channel;
  }

  /**
   * Rejects a pending inbound session request.
   */
  async rejectSession(sessionPDAStr: string): Promise<void> {
    const queued = this.sessions.dequeue(sessionPDAStr);
    if (!queued) {
      return;
    }
    // We could call expire_session or close_session on-chain if we wanted, 
    // but simply ignoring it lets it expire or we can implement explicit reject later.
    console.log(`[${this.profile}] Rejected session ${sessionPDAStr}`);
  }
}

function encryptConnectionData(
  data: ConnectionData,
  sender: Keypair,
  recipient: PublicKey,
): Uint8Array {
  const senderCurveSecret = ed25519SecretToCurve25519(sender.secretKey.slice(0, 32));
  const recipientCurvePublic = ed25519ToCurve25519(recipient.toBytes());
  const payloadStr = JSON.stringify(data);
  const compressed = zlib.deflateSync(Buffer.from(payloadStr));
  return encrypt(compressed, senderCurveSecret, recipientCurvePublic);
}

function decryptConnectionData(
  encrypted: Uint8Array,
  recipient: Keypair,
  sender: PublicKey,
): ConnectionData {
  const recipientCurveSecret = ed25519SecretToCurve25519(recipient.secretKey.slice(0, 32));
  const senderCurvePublic = ed25519ToCurve25519(sender.toBytes());
  const decrypted = decrypt(encrypted, recipientCurveSecret, senderCurvePublic);
  const decompressed = zlib.inflateSync(Buffer.from(decrypted));
  const parsed = JSON.parse(decompressed.toString("utf-8")) as ConnectionData;
  return parsed;
}

export { Channel } from "./channel";
export { generateKeypair, loadKeypair, saveKeypair } from "./keypair";
export { AgentNotFoundError, AliasTakenError, InMemoryRegistryAdapter, SolanaRegistryAdapter } from "./registry";
export { InMemorySignalingAdapter, SolanaSignalingAdapter, SessionRecord } from "./signaling";
export { FileRegistryAdapter, FileSignalingAdapter } from "./file-adapters";
export { SessionManager, ManagedSession } from "./session-manager";
export { completeConnection, createAnswer, createOffer } from "./webrtc";
