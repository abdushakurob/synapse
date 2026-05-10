import { Synapse } from "./index";
import { Keypair } from "@solana/web3.js";

async function runTest() {
  console.log("[Test] Initializing agents...");

  // Setup Registry and Signaling (shared mock state)
  const synapseA = new Synapse({
    profile: "agent-a",
    keypair: Keypair.generate(),
  });

  const synapseB = new Synapse({
    profile: "agent-b",
    keypair: Keypair.generate(),
    // Use the same signaling/registry instances so they can "find" each other
    signaling: (synapseA as any).signaling,
    registry: (synapseA as any).registry,
  });

  console.log("[Test] Registering Agent B...");
  await synapseB.register("meridian-trading");

  console.log("[Test] Agent B starting listener...");
  synapseB.onConnection((channel, from) => {
    console.log(`[Agent B] Incoming connection from: ${from}`);
    channel.onMessage((msg) => {
      console.log(`[Agent B] Received message:`, msg);
      channel.send({ type: "status", message: "Hello from Agent B!" });
    });
  });

  console.log("[Test] Agent A connecting to Agent B...");
  try {
    const channelA = await synapseA.connect("meridian-trading");
    console.log("[Test] Agent A connected!");

    channelA.onMessage((msg) => {
      console.log(`[Agent A] Received message:`, msg);
    });

    console.log("[Test] Agent A sending RFQ...");
    channelA.send({ type: "rfq", asset: "SYN", quantity: 500000, side: "buy" });

    // Keep alive for a bit to see the response
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("[Test] Success! Connection verified.");
    process.exit(0);
  } catch (err: any) {
    console.error("[Test] Connection failed:", err.message);
    process.exit(1);
  }
}

runTest();
