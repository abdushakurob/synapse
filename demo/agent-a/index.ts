import {
  Synapse,
  SolanaRegistryAdapter,
  SolanaSignalingAdapter,
  IDL
} from "@synapse-io/sdk";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { UIBridge } from "../shared/ui-bridge";
import { config } from "./config";
import { Message } from "../shared/schema";
import { generateAgentResponse, ChatMessage } from "../shared/llm";
import * as fs from "fs";
import * as path from "path";
import bs58 from "bs58";

const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const ui = new UIBridge(3001);
  console.log(`[${config.firmName}] Initializing on-chain...`);

  // Load Identity: Check Environment Variable (Cloud) then fallback to JSON (Local)
  let walletKeypair: Keypair;
  if (process.env.SYNAPSE_SECRET_KEY) {
    console.log(`[${config.firmName}] Loading identity from Environment Variable...`);
    const keyStr = process.env.SYNAPSE_SECRET_KEY.trim();
    if (keyStr.startsWith("[")) {
      walletKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyStr)));
    } else {
      walletKeypair = Keypair.fromSecretKey(bs58.decode(keyStr));
    }
  } else {
    const walletFile = path.resolve(__dirname, "../../dev-wallet-a.json");
    if (!fs.existsSync(walletFile)) {
      throw new Error("Identity not found. Set SYNAPSE_SECRET_KEY or create dev-wallet-a.json");
    }
    console.log(`[${config.firmName}] Loading identity from local dev-wallet-a.json...`);
    walletKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(walletFile, "utf-8")))
    );
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(walletKeypair), {
    commitment: "confirmed",
  });

  // Clean initialization using IDL from SDK
  const program = new Program(IDL as any, provider);

  const synapse = new Synapse({
    profile: config.alias,
    keypair: walletKeypair,
    onTransaction: (signature, description) => {
      console.log(`[${config.firmName}] Transaction: ${description} (Sig: ${signature})`);
      ui.notify("blockchain_tx", { signature, description });
    }
  });

  try {
    console.log(`[${config.firmName}] Registering alias "${config.alias}" on-chain...`);
    await synapse.register(config.alias);
    console.log(`[${config.firmName}] Alias registered successfully.`);
  } catch (err: any) {
    console.error(`[${config.firmName}] Registration failed: ${err.message}`);
  }

  // Always send initial portfolio to UI
  ui.notify("portfolio_updated", { portfolio: config.portfolio });
  
  // Send every 10 seconds just to keep UI in sync
  setInterval(() => {
    ui.notify("portfolio_updated", { portfolio: config.portfolio });
  }, 10000);

  const history: ChatMessage[] = [];

  // Wait for the UI to send a 'start' command to initiate connection AND negotiation
  ui.onMessage(async (msg: any) => {
    if (msg.type === "start") {
      console.log(`[${config.firmName}] Start signal received. Initiating P2P connection...`);
      ui.notify("status", { message: "Initiating encrypted P2P handshake via Solana..." });

      try {
        const channel = await synapse.connect("meridian-trading-dev");
        const activeSessions = synapse.sessions.list();
        const sessionPDA = activeSessions.find(s => s.direction === "outbound")?.sessionPDA || "Unknown";

        console.log(`[${config.firmName}] Connected to Meridian Trading.`);
        ui.notify("session_opened", { remoteFirm: "Meridian Trading", sessionPDA });
        ui.notify("status", { message: "P2P Channel Secure. Starting autonomous negotiation..." });

    let isProcessing = false;
    let round = 0;

    channel.onMessage(async (msg: any) => {
      if (!msg || typeof msg !== "object" || !msg.type) return;
      if (isProcessing) return;

      const message = msg as Message;
      
      if (message.type === "status" || message.type === "reject") {
        ui.notify("message_received", { message });
        return;
      }

      // Live Portfolio Updates during negotiation (Simulation of locking funds)
      if ((message as any).price) {
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
      }

      ui.notify("message_received", { message });
      history.push({ role: "user", content: JSON.stringify(message) });

      if (message.type === "execution") {
        console.log(`[${config.firmName}] TRADE EXECUTED: ${message.quantity} SYN @ $${message.price}`);
        config.portfolio.USDC -= (message.quantity * message.price);
        config.portfolio.SYN += message.quantity;
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
        ui.notify("execution_complete", {});
        return;
      }

      // Generate response using sequential demo logic for maximum drama
      try {
        isProcessing = true;
        round++;
        
        // Artificial delay for tension
        await new Promise(r => setTimeout(r, 2500));

        let reasoning = "";
        let reply: any = null;

        if (round === 1) {
          reasoning = "Opening below benchmark to test seller's floor. $0.44 anchors the negotiation low while preserving full range to $0.48 ceiling.";
          reply = { type: "rfq", asset: "SYN", quantity: 500000, side: "buy" }; // Actually the first move after connect is RFQ, so let's adjust
        } else if (round === 2) {
          reasoning = "Meridian's counter signals they believe they have pricing power. Moving to $0.455 shows genuine interest while applying pressure on their spread.";
          reply = { type: "counter", asset: "SYN", quantity: 500000, price: 0.455 };
        } else if (round === 3) {
          reasoning = "Gap has narrowed. Convergence point likely around $0.465. One more move should close this.";
          reply = { type: "counter", asset: "SYN", quantity: 500000, price: 0.463 };
        } else if (round === 4) {
          reasoning = "At $0.463 we are within Meridian's range. Splitting the difference at $0.465 closes this cleanly while staying inside our $0.48 ceiling. Final offer.";
          reply = { type: "counter", asset: "SYN", quantity: 500000, price: 0.465 };
        } else {
          // Fallback to LLM if more rounds happen
          const result = await generateAgentResponse(config.systemPrompt, history, config.portfolio);
          reasoning = result.reasoning;
          reply = result.message;
        }

        ui.notify("reasoning", { text: reasoning });
        ui.notify("message_sent", { message: reply });
        channel.send(reply);
        history.push({ role: "assistant", content: JSON.stringify(reply) });

        if (reply.type === "execution" && reply.agreed) {
          console.log(`[${config.firmName}] TRADE EXECUTED: ${reply.quantity} SYN @ $${reply.price}`);
          config.portfolio.USDC -= (reply.quantity * reply.price);
          config.portfolio.SYN += reply.quantity;
          ui.notify("portfolio_updated", { portfolio: config.portfolio });
          ui.notify("execution_complete", {});
        }
      } catch (err: any) {
        console.error(`[${config.firmName}] Error:`, err.message);
      } finally {
        isProcessing = false;
      }
    });

    // Reset support
    ui.onMessage((msg) => {
      if (msg.type === "reset") {
        history.length = 0;
        round = 0;
        config.portfolio.USDC = 500000;
        config.portfolio.SYN = 0;
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
      }
    });

        // Now that channel is open, send the first RFQ
        const initialPrompt = "Generate the initial Request for Quote (RFQ) to buy 500000 SYN.";
        history.push({ role: "user", content: initialPrompt });

        const { reasoning, message: rfq } = await generateAgentResponse(config.systemPrompt, history, config.portfolio);
        ui.notify("reasoning", { text: reasoning });
        ui.notify("message_sent", { message: rfq });
        channel.send(rfq);
        history.push({ role: "assistant", content: JSON.stringify(rfq) });

      } catch (err: any) {
        console.error(`[${config.firmName}] Connection failed: ${err.message}`);
        ui.notify("status", { message: `Connection failed: ${err.message}` });
      }
    }
  });

  console.log(`[${config.firmName}] Ready. Waiting for user interaction via UI.`);
}

main();
