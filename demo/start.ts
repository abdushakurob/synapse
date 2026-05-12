// Single entry point that runs both agents in one process.
// This allows them to share the UIBridge's static WebSocket server.

async function start() {
  console.log("[Synapse] Starting both agents in shared process...");
  
  // Agent B (listener) must start first
  await import("./agent-b/index");
  
  // Give Agent B time to register and start listening
  await new Promise(r => setTimeout(r, 3000));
  
  // Then Agent A (initiator) connects
  await import("./agent-a/index");
}

start().catch(err => {
  console.error("[Synapse] Fatal:", err);
  process.exit(1);
});
