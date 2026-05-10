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
  const ui = new UIBridge(3002);
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
    const walletFile = path.resolve(__dirname, "../../dev-wallet-b.json");
    if (!fs.existsSync(walletFile)) {
      throw new Error("Identity not found. Set SYNAPSE_SECRET_KEY or create dev-wallet-b.json");
    }
    console.log(`[${config.firmName}] Loading identity from local dev-wallet-b.json...`);
    walletKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(walletFile, "utf-8")))
    );
  }

  const connection = new Connection(RPC_URL, "confirmed");

  // High-level initialization
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

  let isProcessing = false;
  let round = 0;

  synapse.onConnection(async (channel, from) => {
    console.log(`[${config.firmName}] New authorized connection from: ${from}`);
    
    const session = synapse.sessions.list().find(s => s.remotePubkey === from);
    const sessionPDA = session?.sessionPDA || "On-Chain Active";
    
    ui.notify("session_opened", { remoteFirm: "Apex Capital", sessionPDA });
    ui.notify("portfolio_updated", { portfolio: config.portfolio });

    const history: ChatMessage[] = [];

    channel.onMessage(async (msg: any) => {
      if (!msg || typeof msg !== "object" || !msg.type) return;
      if (isProcessing) return;

      const message = msg as Message;

      if (message.type === "status" || message.type === "reject") {
        ui.notify("message_received", { message });
        return;
      }

      // Live Portfolio Updates during negotiation
      if ((message as any).price) {
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
      }

      ui.notify("message_received", { message });
      history.push({ role: "user", content: JSON.stringify(message) });

      if (message.type === "execution") {
        console.log(`[${config.firmName}] TRADE EXECUTED: ${message.quantity} SYN @ $${message.price}`);
        config.portfolio.USDC += (message.quantity * message.price);
        config.portfolio.SYN -= message.quantity;
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
        ui.notify("execution_complete", {});
        return;
      }

      try {
        isProcessing = true;
        round++;

        // Artificial delay for tension
        await new Promise(r => setTimeout(r, 2500));

        let reasoning = "";
        let reply: any = null;

        if (round === 1) {
          reasoning = "Apex's $0.44 opening is significantly below market. Proposing $0.49 to signal premium pricing power and protect our margin.";
          reply = { type: "counter", asset: "SYN", quantity: 500000, price: 0.49 };
        } else if (round === 2) {
          reasoning = "Buyer moved to $0.455. They are showing discipline. Dropping to $0.475 to test their ceiling while maintaining a healthy spread.";
          reply = { type: "counter", asset: "SYN", quantity: 500000, price: 0.475 };
        } else if (round === 3) {
          reasoning = "Apex is pushing into the $0.46 range. We will hold firm at $0.468 to see if they split the difference.";
          reply = { type: "counter", asset: "SYN", quantity: 500000, price: 0.468 };
        } else if (round === 4) {
          reasoning = "Apex's $0.465 offer meets our minimum acceptable threshold of $0.445 and provides a fair premium. Accepting and executing settlement.";
          reply = { type: "execution", asset: "SYN", quantity: 500000, price: 0.465, agreed: true };
        } else {
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
          config.portfolio.USDC += (reply.quantity * reply.price);
          config.portfolio.SYN -= reply.quantity;
          ui.notify("portfolio_updated", { portfolio: config.portfolio });
          ui.notify("execution_complete", {});
        }
      } catch (err: any) {
        console.error(`[${config.firmName}] LLM Error:`, err.message);
      } finally {
        isProcessing = false;
      }
    });
  });

  // Reset support
  ui.onMessage((msg) => {
    if (msg.type === "reset") {
      round = 0;
      config.portfolio.USDC = 0;
      config.portfolio.SYN = 2000000;
      ui.notify("portfolio_updated", { portfolio: config.portfolio });
    }
  });

}

main();
