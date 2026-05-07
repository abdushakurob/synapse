import { Synapse } from "./index";
import { Keypair, PublicKey } from "@solana/web3.js";
import { SessionRecord } from "./signaling";

async function runTest() {
  console.log("[Test] Initializing Agent B with maxConcurrent = 1...");
  const synapseB = new Synapse({
    profile: "agent-b",
    keypair: Keypair.generate(),
    maxConcurrent: 1, // Only 1 active session at a time
  });

  const remoteAgent = Keypair.generate().publicKey;

  const createDummyRecord = (id: number): SessionRecord => {
    const payload = new Uint8Array(24 + 10); // 24 bytes nonce + 10 bytes dummy cipher
    payload[24] = id;
    return {
      sessionPDA: Keypair.generate().publicKey,
      initiator: remoteAgent,
      responder: synapseB.keypair.publicKey,
      encryptedOffer: payload,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 5000,
    };
  };

  console.log("[Test] Mocking decryptConnectionData to bypass crypto for this test...");
  let activeCount = 0;
  (synapseB as any).acceptInbound = async (record: SessionRecord) => {
    activeCount++;
    console.log(`[Test] Agent B accepting session ${record.sessionPDA.toBase58()}. Active: ${activeCount}`);
    // We skip the real decryption logic for this management test
    const channel = { 
        onClose: () => {}, 
        onMessage: () => {},
        send: () => {} 
    } as any;
    
    // Manually register it in sessions as acceptInbound would
    await synapseB.sessions.registerOutbound(record.sessionPDA, channel, remoteAgent.toBase58());
    
    return channel;
  };

  console.log("[Test] Simulating 3 inbound sessions...");
  const record1 = createDummyRecord(1);
  const record2 = createDummyRecord(2);
  const record3 = createDummyRecord(3);

  // Add records to signaling layer so handleInbound/processInbound can find them
  const signaling = (synapseB as any).signaling;
  signaling.sessions.set(record1.sessionPDA.toBase58(), record1);
  signaling.sessions.set(record2.sessionPDA.toBase58(), record2);
  signaling.sessions.set(record3.sessionPDA.toBase58(), record3);

  // We manually call handleInbound which should queue them
  await synapseB.sessions.handleInbound(record1.sessionPDA, record1.encryptedOffer);
  await synapseB.sessions.handleInbound(record2.sessionPDA, record2.encryptedOffer);
  await synapseB.sessions.handleInbound(record3.sessionPDA, record3.encryptedOffer);

  console.log(`[Test] Active sessions in manager: ${synapseB.sessions.list().length}`);
  console.log(`[Test] Queue length: ${(synapseB.sessions as any).inboundQueue.length}`);

  if (synapseB.sessions.list().length !== 1) {
    console.error("[Test] Failed: Too many active sessions!");
    process.exit(1);
  }

  console.log("[Test] Closing first session to trigger dequeue...");
  const activeSession = synapseB.sessions.list()[0];
  await synapseB.sessions.remove(activeSession.sessionPDA);

  // Wait a bit for async dequeue
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log(`[Test] Active sessions after close: ${synapseB.sessions.list().length}`);
  console.log(`[Test] Queue length after close: ${(synapseB.sessions as any).inboundQueue.length}`);

  if (synapseB.sessions.list().length !== 1) {
    console.error("[Test] Failed: Queue did not process!");
    process.exit(1);
  }

  console.log("[Test] Success! Queuing and multi-session logic verified.");
  process.exit(0);
}

runTest();
