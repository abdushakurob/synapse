import Peer from "simple-peer";

// wrtc is a native dependency that can fail to build on some systems.
// We load it lazily and throw a helpful error only if it's actually needed.
function getWrtc() {
  try {
    return require("wrtc");
  } catch (e) {
    throw new Error(
      "[Synapse SDK] The 'wrtc' dependency is missing. " +
      "This is a native module required for P2P connections in Node.js. " +
      "Please install it manually or ensure your system has build-essential/python3 installed. " +
      "Note: This is NOT required for CLI commands like 'whoami' or 'balance'."
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
  // STUN-only by design per project scope.
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/**
 * Creates a WebRTC offer.
 * Returns the peer instance and the offer data (SDP).
 */
export async function createOffer(): Promise<WebRTCConnection> {
  const wrtc = getWrtc();
  return new Promise((resolve, reject) => {
    const peer = new Peer({
      initiator: true,
      trickle: false, // We gather all ICE candidates and send them in one go in the SDP
      config: ICE_CONFIG,
      wrtc,
    });

    peer.on("signal", (data) => {
      if (data.type === "offer") {
        resolve({
          peer,
          data: {
            sdp: data.sdp!,
            type: "offer",
          },
        });
      }
    });

    peer.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Creates a WebRTC answer from an offer.
 * Returns the peer instance and the answer data (SDP).
 */
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
        resolve({
          peer,
          data: {
            sdp: data.sdp!,
            type: "answer",
          },
        });
      }
    });

    peer.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Completes the connection on the initiator side by feeding the answer back.
 */
export async function completeConnection(
  peer: Peer.Instance,
  answerData: ConnectionData,
): Promise<Peer.Instance> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("[WebRTC] Connection timeout"));
    }, 10000);

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
