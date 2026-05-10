"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
/**
 * Channel is a thin message abstraction around a WebRTC data channel.
 * It intentionally sends JSON only to keep message contracts explicit.
 */
class Channel {
    constructor(peer) {
        this.messageHandlers = new Set();
        this.closeHandlers = new Set();
        this.isOpen = false;
        this.peer = peer;
        this.peer.on("connect", () => {
            this.isOpen = true;
        });
        this.peer.on("data", (rawData) => {
            try {
                const decoded = JSON.parse(rawData.toString());
                if (isJsonMessage(decoded)) {
                    for (const handler of this.messageHandlers) {
                        handler(decoded);
                    }
                    return;
                }
                console.warn("[Channel] Ignoring non-object message");
            }
            catch (error) {
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
    send(message) {
        const payload = JSON.stringify(message);
        this.peer.send(payload);
    }
    onMessage(handler) {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }
    onClose(handler) {
        this.closeHandlers.add(handler);
        return () => {
            this.closeHandlers.delete(handler);
        };
    }
    close() {
        this.peer.destroy();
    }
    get connected() {
        return this.isOpen;
    }
}
exports.Channel = Channel;
function isJsonMessage(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
