import { createOffer, createAnswer, completeConnection, WebRTCConnection } from "./webrtc";

async function testP2P() {
  console.log("[Test] Milestone 2 — WebRTC P2P Connection");

  try {
    // 1. Agent A creates an offer
    console.log("[Agent A] Creating offer...");
    const connectionA = await createOffer();
    const offerData = connectionA.data;
    console.log("[Agent A] Offer created.");

    // 2. Agent B receives offer and creates an answer
    console.log("[Agent B] Creating answer...");
    const connectionB = await createAnswer(offerData);
    const answerData = connectionB.data;
    console.log("[Agent B] Answer created.");

    // 3. Agent A receives answer and completes connection
    console.log("[Agent A] Completing connection...");

    // Set up message listeners
    connectionA.peer.on("data", (data) => {
      console.log(`[Agent A] Received: ${data.toString()}`);
    });

    connectionB.peer.on("data", (data) => {
      console.log(`[Agent B] Received: ${data.toString()}`);
      connectionB.peer.send("hello back from agent b");
    });

    await completeConnection(connectionA.peer, answerData);
    console.log("[Agent A] Connected!");

    // 4. Exchange messages
    console.log("[Agent A] Sending: hello from agent a");
    connectionA.peer.send("hello from agent a");

    // Wait for messages to be exchanged
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("[Test] PASSED");
    process.exit(0);
  } catch (err) {
    console.error("[Test] FAILED:", err);
    process.exit(1);
  }
}

testP2P();
