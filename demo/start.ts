import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { validateKey } from "./shared/llm";

async function askForApiKey(): Promise<string | "DEFAULT"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log("\x1b[36m%s\x1b[0m", "\n==========================================================");
    console.log("\x1b[36m%s\x1b[0m", " SYNAPSE TRADING AGENTS: LLM SETUP");
    console.log("\x1b[36m%s\x1b[0m", "==========================================================");
    console.log("To run this demo, you can use our free community relay");
    console.log("or provide your own Together API Key for higher priority.\n");
    
    console.log("1. Use Community Relay (Free, Rate-Limited)");
    console.log("2. Enter Private API Key (High Priority)");
    
    rl.question("\nSelect option [1-2] or paste key directly: ", (answer) => {
      rl.close();
      const input = answer.trim();
      if (input === "1" || input.toLowerCase() === "free" || input === "") {
        resolve("DEFAULT");
      } else if (input === "2") {
        console.log("Please paste your key now (or press Enter for Free):");
        const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl2.question("> ", (key) => {
          rl2.close();
          resolve(key.trim() || "DEFAULT");
        });
      } else {
        resolve(input);
      }
    });
  });
}

async function start() {
  while (true) {
    // Initial Check: If no key AND no relay, we might want to ask immediately
    // but our new dual-mode logic defaults to relay, so we just try to run first.
    
    if (!validateKey() && !process.env.TOGETHER_API_KEY) {
      const choice = await askForApiKey();
      if (choice === "DEFAULT") {
        console.log("\x1b[32m%s\x1b[0m", "[INFO] Using Synapse Community Relay.\n");
      } else if (choice) {
        process.env.TOGETHER_API_KEY = choice;
        try {
          const envPath = path.resolve(process.cwd(), ".env");
          fs.writeFileSync(envPath, `TOGETHER_API_KEY=${choice}\n`, { flag: 'a' });
          console.log("\x1b[32m%s\x1b[0m", "[SUCCESS] Key saved for future sessions.\n");
        } catch (e) {}
      }
    }
    
    try {
      console.log("\x1b[34m%s\x1b[0m", "[Synapse] Initializing boardroom negotiation...");
      
      const { run: runB } = await import("./agent-b/index");
      const { run: runA } = await import("./agent-a/index");

      // Start Agent B first, then A after a delay
      await Promise.all([
        runB(),
        new Promise(r => setTimeout(r, 3000)).then(() => runA())
      ]);
      
      break; // Success!
    } catch (err: any) {
      if (err.name === "RateLimitedError" || err.message === "RELAY_RATE_LIMITED") {
        console.log("\x1b[33m%s\x1b[0m", "\n[NOTICE] The community AI relay is currently at capacity.");
        console.log("To continue the demo immediately, please provide your own Together API Key.");
        console.log("Alternatively, you can wait and try again later.\n");
        
        const key = await askForApiKey();
        if (key) {
          process.env.TOGETHER_API_KEY = key;
          // Persist for next time
          try {
            const envPath = path.resolve(process.cwd(), ".env");
            fs.writeFileSync(envPath, `TOGETHER_API_KEY=${key}\n`, { flag: 'a' });
            console.log("\x1b[32m%s\x1b[0m", "[SUCCESS] Key saved. Restarting agents...\n");
          } catch (e) {}
          continue; // Retry the loop with the new key
        }
      }
      
      console.error("\x1b[31m%s\x1b[0m", "[FATAL] Session failed:", err.message || err);
      process.exit(1);
    }
  }
}

start().catch(err => {
  console.error("[Synapse] Fatal:", err);
  process.exit(1);
});
