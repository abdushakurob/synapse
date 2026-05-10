import Peer from "simple-peer";
export interface ConnectionData {
    sdp: string;
    type: "offer" | "answer";
}
export interface WebRTCConnection {
    peer: Peer.Instance;
    data: ConnectionData;
}
export declare function createOffer(): Promise<WebRTCConnection>;
export declare function createAnswer(offerData: ConnectionData): Promise<WebRTCConnection>;
export declare function completeConnection(peer: Peer.Instance, answerData: ConnectionData): Promise<Peer.Instance>;
