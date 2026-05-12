import Peer from "simple-peer";

/**
 * WRTC Wrapper for Node.js environments.
 * In a real production deployment, the developer ensures 'wrtc' is installed.
 * The SDK loads it lazily to avoid breaking the CLI for users who don't need P2P.
 */
function getWrtc() {
  try {
    // We switch to 'werift' which is a pure TS/WASM implementation.
    // No native binaries required.
    const werift = require("werift");
    return werift.nonStandard.RTCPeerConnection 
      ? werift.nonStandard 
      : werift;
  } catch (e) {
    throw new Error(
      "[Synapse SDK] The 'werift' dependency is missing. " +
      "Run 'npm install werift' to enable pure-JS P2P communication."
    );
  }
}

export interface ConnectionData {
  sdp: string;
  type: "offer" | "answer";
}

export interface WebRTCConnection {
  peer: Peer.Instance;
  data: ConnectionData;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export async function createOffer(): Promise<WebRTCConnection> {
  const wrtc = getWrtc();
  return new Promise((resolve, reject) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: ICE_CONFIG,
      wrtc,
    });

    peer.on("signal", (data) => {
      if (data.type === "offer") {
        resolve({ peer, data: { sdp: data.sdp!, type: "offer" } });
      }
    });

    peer.on("error", (err) => reject(err));
  });
}

export async function createAnswer(offerData: ConnectionData): Promise<WebRTCConnection> {
  const wrtc = getWrtc();
  return new Promise((resolve, reject) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: ICE_CONFIG,
      wrtc,
    });

    peer.signal(offerData);

    peer.on("signal", (data) => {
      if (data.type === "answer") {
        resolve({ peer, data: { sdp: data.sdp!, type: "answer" } });
      }
    });

    peer.on("error", (err) => reject(err));
  });
}

export async function completeConnection(
  peer: Peer.Instance,
  answerData: ConnectionData,
): Promise<Peer.Instance> {
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
