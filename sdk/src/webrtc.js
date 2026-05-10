"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOffer = createOffer;
exports.createAnswer = createAnswer;
exports.completeConnection = completeConnection;
const simple_peer_1 = __importDefault(require("simple-peer"));
/**
 * WRTC Wrapper for Node.js environments.
 * In a real production deployment, the developer ensures 'wrtc' is installed.
 * The SDK loads it lazily to avoid breaking the CLI for users who don't need P2P.
 */
function getWrtc() {
    try {
        return require("wrtc");
    }
    catch (e) {
        throw new Error("[Synapse SDK] The 'wrtc' dependency is missing. " +
            "This is required for P2P connections in Node.js environments. " +
            "Run 'npm install wrtc' to enable P2P communication.");
    }
}
const ICE_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
async function createOffer() {
    const wrtc = getWrtc();
    return new Promise((resolve, reject) => {
        const peer = new simple_peer_1.default({
            initiator: true,
            trickle: false,
            config: ICE_CONFIG,
            wrtc,
        });
        peer.on("signal", (data) => {
            if (data.type === "offer") {
                resolve({ peer, data: { sdp: data.sdp, type: "offer" } });
            }
        });
        peer.on("error", (err) => reject(err));
    });
}
async function createAnswer(offerData) {
    const wrtc = getWrtc();
    return new Promise((resolve, reject) => {
        const peer = new simple_peer_1.default({
            initiator: false,
            trickle: false,
            config: ICE_CONFIG,
            wrtc,
        });
        peer.signal(offerData);
        peer.on("signal", (data) => {
            if (data.type === "answer") {
                resolve({ peer, data: { sdp: data.sdp, type: "answer" } });
            }
        });
        peer.on("error", (err) => reject(err));
    });
}
async function completeConnection(peer, answerData) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error("[WebRTC] Handshake timeout")), 15000);
        peer.signal(answerData);
        peer.on("connect", () => {
            clearTimeout(timeoutId);
            resolve(peer);
        });
        peer.on("error", (err) => {
            clearTimeout(timeoutId);
            reject(err);
        });
    });
}
