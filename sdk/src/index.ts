import zlib from "zlib";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import { Channel } from "./channel";
import { decrypt, ed25519SecretToCurve25519, ed25519ToCurve25519, encrypt } from "./crypto";
import { RegistryAdapter, SolanaRegistryAdapter } from "./registry";
import { SessionRecord, SignalingAdapter, SolanaSignalingAdapter } from "./signaling";
import { ManagedSession, SessionManager } from "./session-manager";
import { completeConnection, ConnectionData, createAnswer, createOffer } from "./webrtc";
import IDL from "./idl.json";

export class ConnectionTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionTimeoutError";
  }
}

export class ConnectionRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionRejectedError";
  }
}

interface SynapseOptions {
  profile: string;
  keypair?: Keypair;
  secretKey?: string; // Base58
  registry?: RegistryAdapter;
  signaling?: SignalingAdapter;
  maxConcurrent?: number;
  accept?: string[];
  network?: string;
  onTransaction?: (signature: string, description: string) => void;
}

type ConnectionHandler = (channel: Channel, from: string) => void | Promise<void>;

export class Synapse {
  readonly profile: string;
  readonly keypair: Keypair;
  readonly sessions: SessionManager;

  private readonly registry: RegistryAdapter;
  private readonly signaling: SignalingAdapter;
  private connectionHandler?: ConnectionHandler;
  private onTransaction?: (signature: string, description: string) => void;
  private acceptList: string[] = [];
  private isOpen: boolean = true;

  constructor(options: SynapseOptions) {
    this.profile = options.profile;
    
    if (options.keypair) {
      this.keypair = options.keypair;
    } else if (options.secretKey) {
      const bs58 = require("bs58");
      this.keypair = Keypair.fromSecretKey(bs58.decode(options.secretKey));
    } else {
      this.keypair = Keypair.generate();
    }

    // Default to Solana if no adapters provided
    if (!options.registry || !options.signaling) {
      const network = options.network || "devnet";
      const rpc = network === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
      const connection = new Connection(rpc, "confirmed");
      const provider = new AnchorProvider(connection, new Wallet(this.keypair), { commitment: "confirmed" });
      const program = new Program(IDL as any, provider);
      this.registry = options.registry || new SolanaRegistryAdapter(program);
      this.signaling = options.signaling || new SolanaSignalingAdapter(program);
    } else {
      this.registry = options.registry;
      this.signaling = options.signaling;
    }

    this.onTransaction = options.onTransaction;
    this.sessions = new SessionManager({
      maxConcurrent: options.maxConcurrent ?? 10,
    });

    if (options.accept) {
      this.acceptList = options.accept;
      this.isOpen = options.accept.includes("*");
      this.setAcceptList(options.accept).catch(console.error);
    }
  }

  async register(alias: string, options: { category?: string, capabilities?: string[] } = {}): Promise<void> {
    const signature = await this.registry.register(alias, options.category || "general", options.capabilities || []);
    if (signature && this.onTransaction) {
      this.onTransaction(signature as string, `Registered Protocol Alias: ${alias}`);
    }
  }

  async setAcceptList(list: string[]): Promise<void> {
    this.acceptList = list;
    this.isOpen = list.includes("*");
    const pubkeys: PublicKey[] = [];
    
    for (const item of list) {
      if (item === "*") continue;
      try {
        if (item.length > 32 && !item.includes("-")) {
          pubkeys.push(new PublicKey(item));
        } else {
          const pk = await this.registry.resolve(item);
          pubkeys.push(pk);
        }
      } catch (err) {
        console.warn(`[SDK] Could not resolve alias in accept list: ${item}`);
      }
    }

    const signature = await this.registry.configure({
      acceptList: pubkeys,
      isOpen: this.isOpen,
    });

    if (this.onTransaction) {
      this.onTransaction(signature, `Updated Agentic Firewall: ${list.join(", ")}`);
    }
  }

  async publish(metadata: { category?: string, capabilities?: string[] }): Promise<void> {
    // Re-use configure to update metadata
    const signature = await this.registry.configure({
      acceptList: [], // Will be handled by the adapter to keep current
      isOpen: true,
      ...metadata
    });
    if (this.onTransaction) {
      this.onTransaction(signature, `Published Discovery Metadata`);
    }
  }

  async discover(filters: { category?: string; capabilities?: string[] }): Promise<any[]> {
    return await this.registry.discover(filters);
  }

  onConnection(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
    this.startListening();
  }

  private async startListening() {
    console.log(`[${this.profile}] Starting Agentic Firewall & Listener...`);
    if (this.signaling.onNewSession) {
      this.signaling.onNewSession(this.keypair.publicKey, async (session) => {
        try {
          if (!this.sessions.get(session.sessionPDA.toBase58())) {
            await this.acceptSession(session.sessionPDA.toBase58());
          }
        } catch (err: any) {
          if (err instanceof ConnectionRejectedError) {
            console.warn(`[Firewall] Blocked unauthorized session: ${err.message}`);
          } else {
            console.error(`[SDK] Error accepting session:`, err);
          }
        }
      });
    }

  }

  async connect(target: string | PublicKey): Promise<Channel> {
    let responder: PublicKey;
    let responderAlias: string;

    if (typeof target === "string") {
      if (target.length > 32 && !target.includes("-")) {
        responder = new PublicKey(target);
        // Find alias for the pubkey to satisfy contract seeds
        const results = await this.registry.discover({});
        const match = results.find(r => r.owner.equals(responder));
        if (!match) throw new Error(`[SDK] Could not find alias for responder: ${target}`);
        responderAlias = match.alias;
      } else {
        responderAlias = target;
        responder = await this.registry.resolve(target);
      }
    } else {
      responder = target;
      const results = await this.registry.discover({});
      const match = results.find(r => r.owner.equals(responder));
      if (!match) throw new Error(`[SDK] Could not find alias for responder: ${target.toBase58()}`);
      responderAlias = match.alias;
    }

    const offer = await createOffer();
    const encryptedOffer = encryptConnectionData(offer.data, this.keypair, responder);

    try {
      const { record, signature } = await this.signaling.createSession(
        this.keypair.publicKey,
        responder,
        encryptedOffer,
        responderAlias
      );

      if (this.onTransaction) {
        this.onTransaction(signature, `Initiated Handshake with ${responderAlias}`);
      }

      const encryptedAnswer = await this.signaling.waitForAnswer(record.sessionPDA, 30000);
      const answer = decryptConnectionData(encryptedAnswer, this.keypair, responder);
      const peer = await completeConnection(offer.peer, answer);
      const channel = new Channel(peer);
      await this.sessions.registerOutbound(record.sessionPDA, channel, responder.toBase58());
      return channel;
    } catch (err: any) {
      if (err.message.includes("UnauthorizedInitiator")) {
        throw new ConnectionRejectedError(`[SDK] Connection rejected: You are not on ${responderAlias}'s accept list.`);
      }
      throw err;
    }
  }

  async acceptSession(sessionPDAStr: string): Promise<Channel> {
    const record = await this.signaling.getSession(new PublicKey(sessionPDAStr));
    if (!record) throw new Error(`[SDK] Session ${sessionPDAStr} not found.`);

    // Local Agentic Firewall Check
    if (!this.isOpen) {
      // Find the alias of the initiator to check against acceptList
      const discover = await this.registry.discover({});
      const entry = discover.find(a => a.owner.equals(record.initiator));
      const initiatorAlias = entry?.alias || record.initiator.toBase58();
      
      const isAuthorized = this.acceptList.some(pattern => {
        if (pattern === initiatorAlias) return true;
        if (pattern.includes("*")) {
           const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
           return regex.test(initiatorAlias);
        }
        return false;
      });

      if (!isAuthorized) {
        throw new ConnectionRejectedError(`[Firewall] Unauthorized connection from ${initiatorAlias} rejected.`);
      }
    }

    const initiator = record.initiator;
    const offerData = decryptConnectionData(record.encryptedOffer, this.keypair, initiator);
    const answer = await createAnswer(offerData);
    const encryptedAnswer = encryptConnectionData(answer.data, this.keypair, initiator);
    
    const signature = await this.signaling.respondToSession(record.sessionPDA, encryptedAnswer);
    if (this.onTransaction) {
      this.onTransaction(signature, `Accepted Connection from ${initiator.toBase58()}`);
    }
    
    const channel = new Channel(answer.peer);
    await this.sessions.registerInbound(record.sessionPDA, channel, initiator.toBase58());
    
    if (this.connectionHandler) {
      await this.connectionHandler(channel, initiator.toBase58());
    }
    return channel;
  }
}

function encryptConnectionData(data: ConnectionData, sender: Keypair, recipient: PublicKey): Uint8Array {
  const senderCurveSecret = ed25519SecretToCurve25519(sender.secretKey.slice(0, 32));
  const recipientCurvePublic = ed25519ToCurve25519(recipient.toBytes());
  const payloadStr = JSON.stringify(data);
  const compressed = zlib.deflateSync(Buffer.from(payloadStr));
  return encrypt(compressed, senderCurveSecret, recipientCurvePublic);
}

function decryptConnectionData(encrypted: Uint8Array, recipient: Keypair, sender: PublicKey): ConnectionData {
  const recipientCurveSecret = ed25519SecretToCurve25519(recipient.secretKey.slice(0, 32));
  const senderCurvePublic = ed25519ToCurve25519(sender.toBytes());
  const decrypted = decrypt(encrypted, recipientCurveSecret, senderCurvePublic);
  const decompressed = zlib.inflateSync(Buffer.from(decrypted));
  return JSON.parse(decompressed.toString("utf-8")) as ConnectionData;
}

export { Channel } from "./channel";
export { generateKeypair, loadKeypair, saveKeypair } from "./keypair";
export { RegistryAdapter, SolanaRegistryAdapter } from "./registry";
export { SolanaSignalingAdapter, SessionRecord } from "./signaling";
export { SessionManager, ManagedSession } from "./session-manager";
export { completeConnection, createAnswer, createOffer } from "./webrtc";
export { default as IDL } from "./idl.json";

