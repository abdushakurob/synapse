import type Peer from "simple-peer";

export type JsonMessage = Record<string, unknown>;
type MessageHandler = (message: JsonMessage) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * Channel is a thin message abstraction around a WebRTC data channel.
 * It intentionally sends JSON only to keep message contracts explicit.
 */
export class Channel {
  private readonly peer: Peer.Instance;
  private readonly messageHandlers: Set<MessageHandler> = new Set();
  private readonly closeHandlers: Set<CloseHandler> = new Set();
  private readonly openHandlers: Set<OpenHandler> = new Set();
  private isOpen = false;
  public sessionPDA?: string;

  constructor(peer: Peer.Instance) {
    this.peer = peer;

    this.peer.on("connect", () => {
      this.isOpen = true;
      for (const handler of this.openHandlers) {
        handler();
      }
    });

    this.peer.on("data", (rawData: Buffer) => {
      try {
        const decoded: unknown = JSON.parse(rawData.toString());
        if (isJsonMessage(decoded)) {
          for (const handler of this.messageHandlers) {
            handler(decoded);
          }
          return;
        }
        console.warn("[Channel] Ignoring non-object message");
      } catch (error) {
        console.warn("[Channel] Failed to parse message", error);
      }
    });

    this.peer.on("close", () => {
      this.isOpen = false;
      for (const handler of this.closeHandlers) {
        handler();
      }
    });
  }

  send(message: JsonMessage): void {
    const payload = JSON.stringify(message);
    this.peer.send(payload);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  onOpen(handler: OpenHandler): () => void {
    // If already connected, fire on next tick to keep ordering predictable.
    if (this.isOpen) {
      queueMicrotask(() => handler());
    }
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  close(): void {
    this.peer.destroy();
  }

  get connected(): boolean {
    return this.isOpen;
  }
}

function isJsonMessage(value: unknown): value is JsonMessage {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
