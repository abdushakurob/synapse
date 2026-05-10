import { Synapse } from "./index";
import { Keypair } from "@solana/web3.js";
import { FileRegistryAdapter, FileSignalingAdapter } from "./file-adapters";
import * as path from "path";
import * as fs from "fs";

async function runTest() {
  console.log("\n[FIREWALL TEST] Initializing Decentralized Environment...");

  const registryFile = path.join(process.cwd(), "test-registry.json");
  const signalingFile = path.join(process.cwd(), "test-signaling.json");

  // Cleanup old test state
  if (fs.existsSync(registryFile)) fs.unlinkSync(registryFile);
  if (fs.existsSync(signalingFile)) fs.unlinkSync(signalingFile);

  const registry = new FileRegistryAdapter(registryFile);
  const signaling = new FileSignalingAdapter(signalingFile);

  // Agent B: Responder with Firewall enabled
  const synapseB = new Synapse({
    profile: "meridian-trading",
    registry,
    signaling,
    accept: ["apex-capital"] // ONLY allow apex-capital
  });
  registry.setOwner("meridian-trading", (synapseB as any).keypair.publicKey);

  await synapseB.register("meridian-trading", { 
    category: "market-maker", 
    capabilities: ["quote", "trade"] 
  });

  synapseB.onConnection((channel, from) => {
    console.log(`[FIREWALL] Responder accepted authorized connection from: ${from}`);
  });

  console.log("[FIREWALL] Responder (Meridian) is STRICT. Only accepting 'apex-capital'.");

  // Agent A: Authorized Initiator
  const synapseA = new Synapse({
    profile: "apex-capital",
    registry,
    signaling
  });
  registry.setOwner("apex-capital", (synapseA as any).keypair.publicKey);
  await synapseA.register("apex-capital");

  // Agent C: Unauthorized Initiator
  const synapseC = new Synapse({
    profile: "rogue-agent",
    registry,
    signaling
  });
  registry.setOwner("rogue-agent", (synapseC as any).keypair.publicKey);
  await synapseC.register("rogue-agent");

  console.log("\n[FIREWALL] TEST 1: Authorized Handshake");
  try {
    const channelA = await synapseA.connect("meridian-trading");
    console.log("[FIREWALL] SUCCESS: Apex Capital connected to Meridian.");
  } catch (err: any) {
    console.error("[FIREWALL] FAILED: Authorized connection blocked:", err.message);
  }

  console.log("\n[FIREWALL] TEST 2: Unauthorized Handshake (Should Fail)");
  try {
    await synapseC.connect("meridian-trading");
    console.error("[FIREWALL] FAILED: Rogue Agent was NOT blocked by Firewall.");
  } catch (err: any) {
    console.log("[FIREWALL] SUCCESS: Rogue Agent correctly blocked:", err.message);
  }

  console.log("\n[FIREWALL] TEST 3: Discovery");
  const discovered = await synapseA.discover({ category: "market-maker" });
  if (discovered.length > 0 && discovered[0].alias === "meridian-trading") {
    console.log("[FIREWALL] SUCCESS: Discovered Meridian via on-chain metadata.");
  } else {
    console.error("[FIREWALL] FAILED: Meridian not found in discovery.");
  }

  process.exit(0);
}

runTest().catch(console.error);
