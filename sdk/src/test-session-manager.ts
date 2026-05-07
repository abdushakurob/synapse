import { Keypair } from "@solana/web3.js";
import { EventEmitter } from "events";
import type Peer from "simple-peer";
import { Channel } from "./channel";
import { SessionManager } from "./session-manager";

async function run(): Promise<void> {
  console.log("[Test] SessionManager queue behavior");
  const createdChannels: Channel[] = [];

  const manager = new SessionManager({
    maxConcurrent: 1,
    processInbound: async (queued) => {
      const channel = createDisconnectedChannel();
      createdChannels.push(channel);
      return {
        sessionPDA: queued.sessionPDA.toBase58(),
        channel,
        direction: "inbound",
        remotePubkey: Keypair.generate().publicKey.toBase58(),
        openedAt: Date.now(),
        status: "active",
      };
    },
    isQueuedSessionExpired: () => false,
  });

  const first = Keypair.generate().publicKey;
  const second = Keypair.generate().publicKey;

  await manager.handleInbound(first, Uint8Array.from([1]));
  await manager.handleInbound(second, Uint8Array.from([2]));

  if (manager.list().length !== 1) {
    throw new Error("[Test] Expected one active session before dequeue");
  }

  await manager.remove(first.toBase58());

  if (manager.get(second.toBase58()) === undefined) {
    throw new Error("[Test] Expected queued session to auto-dequeue after remove");
  }

  for (const channel of createdChannels) {
    channel.close();
  }

  console.log("[Test] PASSED");
}

function createDisconnectedChannel(): Channel {
  const peer = new FakePeer() as unknown as Peer.Instance;
  return new Channel(peer);
}

class FakePeer extends EventEmitter {
  send(_payload: string): void {
    // No-op for queue behavior test.
  }

  destroy(): void {
    this.emit("close");
  }
}

void run().catch((error: unknown) => {
  console.error("[Test] FAILED", error);
  process.exit(1);
});
