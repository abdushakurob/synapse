import { Keypair, PublicKey } from "@solana/web3.js";
import { Channel } from "./channel";
import { decrypt, ed25519ToCurve25519, encrypt } from "./crypto";
import { InMemoryRegistryAdapter, RegistryAdapter } from "./registry";
import { InMemorySignalingAdapter, SessionRecord, SignalingAdapter } from "./signaling";
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
}

type ConnectionHandler = (channel: Channel, from: string) => void | Promise<void>;

export class Synapse {
  readonly profile: string;
  readonly keypair: Keypair;
  readonly sessions: SessionManager;

  private readonly registry: RegistryAdapter;
  private readonly signaling: SignalingAdapter;
  private connectionHandler?: ConnectionHandler;

  constructor(options: SynapseOptions) {
    this.profile = options.profile;
    this.keypair = options.keypair ?? Keypair.generate();
    this.registry = options.registry ?? new InMemoryRegistryAdapter();
    this.signaling = options.signaling ?? new InMemorySignalingAdapter();

    this.sessions = new SessionManager({
      maxConcurrent: options.maxConcurrent ?? 10,
      processInbound: async () => null,
    });
  }

  async register(alias: string): Promise<void> {
    await this.registry.register(alias, this.keypair.publicKey);
  }

  onConnection(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
  }

  async connect(alias: string): Promise<Channel> {
    const responder = await this.registry.resolve(alias);
    const offer = await createOffer();
    const encryptedOffer = encryptConnectionData(offer.data, this.keypair, responder);

    const session = await this.signaling.createSession(
      this.keypair.publicKey,
      responder,
      encryptedOffer,
    );

    let encryptedAnswer: Uint8Array;
    try {
      encryptedAnswer = await this.signaling.waitForAnswer(session.sessionPDA);
    } catch {
      throw new ConnectionTimeoutError("[SDK] Timed out waiting for responder answer");
    }

    const answer = decryptConnectionData(encryptedAnswer, this.keypair, responder);
    const peer = await completeConnection(offer.peer, answer);
    const channel = new Channel(peer);
    await this.sessions.registerOutbound(session.sessionPDA, channel, responder.toBase58());
    return channel;
  }

  /**
   * Handles an inbound session record. This is the entrypoint used by listeners.
   */
  async acceptInbound(record: SessionRecord): Promise<Channel> {
    const initiator = record.initiator;
    const offerData = decryptConnectionData(record.encryptedOffer, this.keypair, initiator);
    const answer = await createAnswer(offerData);
    const encryptedAnswer = encryptConnectionData(answer.data, this.keypair, initiator);
    await this.signaling.respondToSession(record.sessionPDA, encryptedAnswer);
    const channel = new Channel(answer.peer);

    const managed: ManagedSession = {
      sessionPDA: record.sessionPDA.toBase58(),
      channel,
      direction: "inbound",
      remotePubkey: initiator.toBase58(),
      openedAt: Date.now(),
      status: "active",
    };

    await this.sessions.registerOutbound(record.sessionPDA, channel, initiator.toBase58());
    if (this.connectionHandler) {
      await this.connectionHandler(channel, initiator.toBase58());
    }
    // Keep managed for potential future custom logic.
    void managed;
    return channel;
  }
}

function encryptConnectionData(
  data: ConnectionData,
  sender: Keypair,
  recipient: PublicKey,
): Uint8Array {
  const senderCurveSecret = ed25519ToCurve25519(sender.secretKey.slice(0, 32));
  const recipientCurvePublic = ed25519ToCurve25519(recipient.toBytes());
  const payload = new TextEncoder().encode(JSON.stringify(data));
  return encrypt(payload, senderCurveSecret, recipientCurvePublic);
}

function decryptConnectionData(
  encrypted: Uint8Array,
  recipient: Keypair,
  sender: PublicKey,
): ConnectionData {
  const recipientCurveSecret = ed25519ToCurve25519(recipient.secretKey.slice(0, 32));
  const senderCurvePublic = ed25519ToCurve25519(sender.toBytes());
  const decrypted = decrypt(encrypted, recipientCurveSecret, senderCurvePublic);
  const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as ConnectionData;
  return parsed;
}

export { Channel } from "./channel";
export { generateKeypair, loadKeypair, saveKeypair } from "./keypair";
export { AgentNotFoundError, AliasTakenError, InMemoryRegistryAdapter } from "./registry";
export { InMemorySignalingAdapter } from "./signaling";
export { SessionManager } from "./session-manager";
export { completeConnection, createAnswer, createOffer } from "./webrtc";
