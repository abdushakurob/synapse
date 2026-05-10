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
    ui.notify("portfolio_updated", { portfolio: config.portfolio });
  } catch (err: any) {
    console.error(`[${config.firmName}] Registration failed: ${err.message}`);
    // If it's already taken, we can continue
    if (!err.message.includes("already registered")) {
       // process.exit(1);
    }
  }

  synapse.onConnection(async (channel, from) => {
    console.log(`[${config.firmName}] New authorized connection from: ${from}`);
    ui.notify("session_opened", { remoteFirm: "Apex Capital", sessionPDA: "On-Chain Active" });
    ui.notify("portfolio_updated", { portfolio: config.portfolio });

    const history: ChatMessage[] = [];

    channel.onMessage(async (msg: any) => {
      if (!msg || typeof msg !== "object" || !msg.type) return;

      const message = msg as Message;
      console.log(`[${config.firmName}] Received:`, JSON.stringify(message));
      ui.notify("message_received", { message });
      history.push({ role: "user", content: JSON.stringify(message) });

      if (message.type === "execution" && message.agreed) {
        config.portfolio.USDC += (message.quantity * message.price);
        config.portfolio.SYN -= message.quantity;
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
        return;
      }

      try {
        console.log(`[${config.firmName}] Thinking...`);
        const { reasoning, message: reply } = await generateAgentResponse(config.systemPrompt, history, config.portfolio);

        ui.notify("reasoning", { text: reasoning });
        ui.notify("message_sent", { message: reply });
        channel.send(reply);
        history.push({ role: "assistant", content: JSON.stringify(reply) });

        if (reply.type === "execution" && reply.agreed) {
          config.portfolio.USDC += (reply.quantity * reply.price);
          config.portfolio.SYN -= reply.quantity;
          ui.notify("portfolio_updated", { portfolio: config.portfolio });
        }
      } catch (err: any) {
        console.error(`[${config.firmName}] LLM Error:`, err.message);
      }
    });
  });

  synapse.onConnection(async (channel, from) => {
    console.log(`[${config.firmName}] Outbound connection established with: ${from}`);
    // This handles outbound connections if Agent B initiated one
  });
}

main();
