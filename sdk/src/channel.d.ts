import type Peer from "simple-peer";
export type JsonMessage = Record<string, unknown>;
type MessageHandler = (message: JsonMessage) => void;
type CloseHandler = () => void;
/**
 * Channel is a thin message abstraction around a WebRTC data channel.
 * It intentionally sends JSON only to keep message contracts explicit.
 */
export declare class Channel {
    private readonly peer;
    private readonly messageHandlers;
    private readonly closeHandlers;
    private isOpen;
    constructor(peer: Peer.Instance);
    send(message: JsonMessage): void;
    onMessage(handler: MessageHandler): () => void;
    onClose(handler: CloseHandler): () => void;
    close(): void;
    get connected(): boolean;
}
export {};
