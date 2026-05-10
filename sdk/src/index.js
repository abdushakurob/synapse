"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL = exports.createOffer = exports.createAnswer = exports.completeConnection = exports.SessionManager = exports.SolanaSignalingAdapter = exports.SolanaRegistryAdapter = exports.saveKeypair = exports.loadKeypair = exports.generateKeypair = exports.Channel = exports.Synapse = exports.ConnectionRejectedError = exports.ConnectionTimeoutError = void 0;
const zlib_1 = __importDefault(require("zlib"));
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const channel_1 = require("./channel");
const crypto_1 = require("./crypto");
const registry_1 = require("./registry");
const signaling_1 = require("./signaling");
const session_manager_1 = require("./session-manager");
const webrtc_1 = require("./webrtc");
const idl_json_1 = __importDefault(require("./idl.json"));
class ConnectionTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "ConnectionTimeoutError";
    }
}
exports.ConnectionTimeoutError = ConnectionTimeoutError;
class ConnectionRejectedError extends Error {
    constructor(message) {
        super(message);
        this.name = "ConnectionRejectedError";
    }
}
exports.ConnectionRejectedError = ConnectionRejectedError;
class Synapse {
    constructor(options) {
        this.profile = options.profile;
        if (options.keypair) {
            this.keypair = options.keypair;
        }
        else if (options.secretKey) {
            const bs58 = require("bs58");
            this.keypair = web3_js_1.Keypair.fromSecretKey(bs58.decode(options.secretKey));
        }
        else {
            this.keypair = web3_js_1.Keypair.generate();
        }
        // Default to Solana if no adapters provided
        if (!options.registry || !options.signaling) {
            const network = options.network || "devnet";
            const rpc = network === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
            const connection = new web3_js_1.Connection(rpc, "confirmed");
            const provider = new anchor_1.AnchorProvider(connection, new anchor_1.Wallet(this.keypair), { commitment: "confirmed" });
            const program = new anchor_1.Program(idl_json_1.default, provider);
            this.registry = options.registry || new registry_1.SolanaRegistryAdapter(program);
            this.signaling = options.signaling || new signaling_1.SolanaSignalingAdapter(program);
        }
        else {
            this.registry = options.registry;
            this.signaling = options.signaling;
        }
        this.onTransaction = options.onTransaction;
        this.sessions = new session_manager_1.SessionManager({
            maxConcurrent: options.maxConcurrent ?? 10,
        });
        if (options.accept) {
            this.setAcceptList(options.accept).catch(console.error);
        }
    }
    async register(alias, options = {}) {
        const signature = await this.registry.register(alias, options.category || "general", options.capabilities || []);
        if (signature && this.onTransaction) {
            this.onTransaction(signature, `Registered Protocol Alias: ${alias}`);
        }
    }
    async setAcceptList(list) {
        const isOpen = list.includes("*");
        const pubkeys = [];
        for (const item of list) {
            if (item === "*")
                continue;
            try {
                if (item.length > 32 && !item.includes("-")) {
                    pubkeys.push(new web3_js_1.PublicKey(item));
                }
                else {
                    const pk = await this.registry.resolve(item);
                    pubkeys.push(pk);
                }
            }
            catch (err) {
                console.warn(`[SDK] Could not resolve alias in accept list: ${item}`);
            }
        }
        const signature = await this.registry.configure({
            acceptList: pubkeys,
            isOpen,
        });
        if (this.onTransaction) {
            this.onTransaction(signature, `Updated Agentic Firewall: ${list.join(", ")}`);
        }
    }
    async publish(metadata) {
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
    async discover(filters) {
        return await this.registry.discover(filters);
    }
    onConnection(handler) {
        this.connectionHandler = handler;
        this.startListening();
    }
    async startListening() {
        console.log(`[${this.profile}] Starting Agentic Firewall & Listener...`);
        if (this.signaling.onNewSession) {
            this.signaling.onNewSession(this.keypair.publicKey, async (session) => {
                if (!this.sessions.get(session.sessionPDA.toBase58())) {
                    await this.acceptSession(session.sessionPDA.toBase58());
                }
            });
        }
    }
    async connect(target) {
        let responder;
        let responderAlias;
        if (typeof target === "string") {
            if (target.length > 32 && !target.includes("-")) {
                responder = new web3_js_1.PublicKey(target);
                // Find alias for the pubkey to satisfy contract seeds
                const results = await this.registry.discover({});
                const match = results.find(r => r.owner.equals(responder));
                if (!match)
                    throw new Error(`[SDK] Could not find alias for responder: ${target}`);
                responderAlias = match.alias;
            }
            else {
                responderAlias = target;
                responder = await this.registry.resolve(target);
            }
        }
        else {
            responder = target;
            const results = await this.registry.discover({});
            const match = results.find(r => r.owner.equals(responder));
            if (!match)
                throw new Error(`[SDK] Could not find alias for responder: ${target.toBase58()}`);
            responderAlias = match.alias;
        }
        const offer = await (0, webrtc_1.createOffer)();
        const encryptedOffer = encryptConnectionData(offer.data, this.keypair, responder);
        try {
            const { record, signature } = await this.signaling.createSession(this.keypair.publicKey, responder, encryptedOffer, responderAlias);
            if (this.onTransaction) {
                this.onTransaction(signature, `Initiated Handshake with ${responderAlias}`);
            }
            const encryptedAnswer = await this.signaling.waitForAnswer(record.sessionPDA, 30000);
            const answer = decryptConnectionData(encryptedAnswer, this.keypair, responder);
            const peer = await (0, webrtc_1.completeConnection)(offer.peer, answer);
            const channel = new channel_1.Channel(peer);
            await this.sessions.registerOutbound(record.sessionPDA, channel, responder.toBase58());
            return channel;
        }
        catch (err) {
            if (err.message.includes("UnauthorizedInitiator")) {
                throw new ConnectionRejectedError(`[SDK] Connection rejected: You are not on ${responderAlias}'s accept list.`);
            }
            throw err;
        }
    }
    async acceptSession(sessionPDAStr) {
        const record = await this.signaling.getSession(new web3_js_1.PublicKey(sessionPDAStr));
        if (!record)
            throw new Error(`[SDK] Session ${sessionPDAStr} not found.`);
        const initiator = record.initiator;
        const offerData = decryptConnectionData(record.encryptedOffer, this.keypair, initiator);
        const answer = await (0, webrtc_1.createAnswer)(offerData);
        const encryptedAnswer = encryptConnectionData(answer.data, this.keypair, initiator);
        const signature = await this.signaling.respondToSession(record.sessionPDA, encryptedAnswer);
        if (this.onTransaction) {
            this.onTransaction(signature, `Accepted Connection from ${initiator.toBase58()}`);
        }
        const channel = new channel_1.Channel(answer.peer);
        await this.sessions.registerInbound(record.sessionPDA, channel, initiator.toBase58());
        if (this.connectionHandler) {
            await this.connectionHandler(channel, initiator.toBase58());
        }
        return channel;
    }
}
exports.Synapse = Synapse;
function encryptConnectionData(data, sender, recipient) {
    const senderCurveSecret = (0, crypto_1.ed25519SecretToCurve25519)(sender.secretKey.slice(0, 32));
    const recipientCurvePublic = (0, crypto_1.ed25519ToCurve25519)(recipient.toBytes());
    const payloadStr = JSON.stringify(data);
    const compressed = zlib_1.default.deflateSync(Buffer.from(payloadStr));
    return (0, crypto_1.encrypt)(compressed, senderCurveSecret, recipientCurvePublic);
}
function decryptConnectionData(encrypted, recipient, sender) {
    const recipientCurveSecret = (0, crypto_1.ed25519SecretToCurve25519)(recipient.secretKey.slice(0, 32));
    const senderCurvePublic = (0, crypto_1.ed25519ToCurve25519)(sender.toBytes());
    const decrypted = (0, crypto_1.decrypt)(encrypted, recipientCurveSecret, senderCurvePublic);
    const decompressed = zlib_1.default.inflateSync(Buffer.from(decrypted));
    return JSON.parse(decompressed.toString("utf-8"));
}
var channel_2 = require("./channel");
Object.defineProperty(exports, "Channel", { enumerable: true, get: function () { return channel_2.Channel; } });
var keypair_1 = require("./keypair");
Object.defineProperty(exports, "generateKeypair", { enumerable: true, get: function () { return keypair_1.generateKeypair; } });
Object.defineProperty(exports, "loadKeypair", { enumerable: true, get: function () { return keypair_1.loadKeypair; } });
Object.defineProperty(exports, "saveKeypair", { enumerable: true, get: function () { return keypair_1.saveKeypair; } });
var registry_2 = require("./registry");
Object.defineProperty(exports, "SolanaRegistryAdapter", { enumerable: true, get: function () { return registry_2.SolanaRegistryAdapter; } });
var signaling_2 = require("./signaling");
Object.defineProperty(exports, "SolanaSignalingAdapter", { enumerable: true, get: function () { return signaling_2.SolanaSignalingAdapter; } });
var session_manager_2 = require("./session-manager");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return session_manager_2.SessionManager; } });
var webrtc_2 = require("./webrtc");
Object.defineProperty(exports, "completeConnection", { enumerable: true, get: function () { return webrtc_2.completeConnection; } });
Object.defineProperty(exports, "createAnswer", { enumerable: true, get: function () { return webrtc_2.createAnswer; } });
Object.defineProperty(exports, "createOffer", { enumerable: true, get: function () { return webrtc_2.createOffer; } });
var idl_json_2 = require("./idl.json");
Object.defineProperty(exports, "IDL", { enumerable: true, get: function () { return __importDefault(idl_json_2).default; } });
