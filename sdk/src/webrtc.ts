import Peer from "simple-peer";

/**
 * WRTC Wrapper for Node.js environments.
 * In a real production deployment, the developer ensures 'wrtc' is installed.
 * The SDK loads it lazily to avoid breaking the CLI for users who don't need P2P.
 */
function getWrtc() {
  const path = require("path");
  const fs = require("fs");
  
  try {
    return require("wrtc");
  } catch (e) {
    const searchPaths = [
      process.cwd(),
      path.join(process.cwd(), "node_modules"),
      path.join(process.cwd(), "sdk/node_modules"),
      path.join(process.cwd(), "demo/node_modules"),
      "/app/node_modules",
      "/app/sdk/node_modules"
    ];

    for (const p of searchPaths) {
      try {
        const resolved = require.resolve("wrtc", { paths: [p] });
        if (resolved) return require(resolved);
      } catch (err) {}
    }

    console.error(`[Synapse SDK] FATAL: wrtc not found.`);
    console.error(`[Synapse SDK] CWD: ${process.cwd()}`);
    console.error(`[Synapse SDK] App Root Contents: ${fs.readdirSync("/app").join(", ")}`);
    
    throw new Error(
      "[Synapse SDK] The 'wrtc' dependency is missing. " +
      "This is required for P2P connections in Node.js environments. " +
      "Run 'npm install wrtc' to enable P2P communication."
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
