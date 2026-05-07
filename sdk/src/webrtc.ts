import Peer from "simple-peer";
import wrtc from "wrtc";

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
  return new Promise((resolve, reject) => {
    const peer = new Peer({
      initiator: true,
      trickle: false, // We gather all ICE candidates and send them in one go in the SDP
      config: ICE_CONFIG,
      wrtc: wrtc,
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
  return new Promise((resolve, reject) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: ICE_CONFIG,
      wrtc: wrtc,
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
