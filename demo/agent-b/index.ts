import {
  Synapse,
  SolanaRegistryAdapter,
  SolanaSignalingAdapter,
} from "@synapse/sdk";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import idl from "../../sdk/src/idl.json";
import { UIBridge } from "../shared/ui-bridge";
import { config } from "./config";
import { Message } from "../shared/schema";
import { generateAgentResponse, ChatMessage } from "../shared/llm";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("eCv677gAYX6ptLtJrPv9Rj8C4eGA4c9ecswRT5QJbeG");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const ui = new UIBridge(3002);
  console.log(`[${config.firmName}] Initializing on-chain...`);

  // Load dev-wallet
  const walletFile = path.resolve(__dirname, "../../dev-wallet.json");
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletFile, "utf-8")))
  );

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(walletKeypair), {
    commitment: "confirmed",
  });
  const program = new Program(idl as any, provider);

  const synapse = new Synapse({
    profile: config.alias,
    keypair: walletKeypair,
    registry: new SolanaRegistryAdapter(program),
    signaling: new SolanaSignalingAdapter(program),
  });

  try {
    console.log(`[${config.firmName}] Registering alias "${config.alias}" on-chain...`);
    await synapse.register(config.alias);
    console.log(`[${config.firmName}] Alias registered successfully.`);
  } catch (err: any) {
    console.error(`[${config.firmName}] Registration failed: ${err.message}`);
    // If it's already taken, we can continue
    if (!err.message.includes("already registered")) {
       // process.exit(1);
    }
  }
  
  synapse.onRequest(async (request) => {
    console.log(`[${config.firmName}] New connection request from: ${request.from} (Session: ${request.sessionPDA.toBase58()})`);
    console.log(`[${config.firmName}] Evaluating request... Accepting.`);
    
    try {
      const channel = await synapse.acceptSession(request.sessionPDA.toBase58());
      console.log(`[${config.firmName}] Session accepted and channel opened!`);
      ui.notify("session_opened", { remoteFirm: "Apex Capital", sessionPDA: request.sessionPDA.toBase58() });
      ui.notify("portfolio_updated", { portfolio: config.portfolio });

      const history: ChatMessage[] = [];

      channel.onMessage(async (msg: any) => {
        // Schema validation
        if (!msg || typeof msg !== "object" || !msg.type) {
          console.warn(`[${config.firmName}] Invalid message format received.`);
          return;
        }

        const message = msg as Message;
        console.log(`[${config.firmName}] Received:`, JSON.stringify(message));
        ui.notify("message_received", { message });
        
        history.push({ role: "user", content: JSON.stringify(message) });

        // Handle execution updates to portfolio locally
        if (message.type === "execution") {
          if (message.agreed) {
            console.log(`[${config.firmName}] CONFIRMED: Sold ${message.quantity} SYN @ $${message.price}`);
            config.portfolio.USDC += (message.quantity * message.price);
            config.portfolio.SYN -= message.quantity;
            ui.notify("portfolio_updated", { portfolio: config.portfolio });
            channel.send({ type: "status", message: "Trade confirmed. Session remains open for inspection." });
          }
          return;
        }

        if (message.type === "reject") {
          console.log(`[${config.firmName}] Client rejected: ${message.reason}`);
          return;
        }

        if (message.type === "status") {
          console.log(`[${config.firmName}] Client status: ${message.message}`);
          return;
        }

        try {
          console.log(`[${config.firmName}] Thinking...`);
          const { reasoning, message: reply } = await generateAgentResponse(config.systemPrompt, history, config.portfolio);
          
          console.log(`[${config.firmName}] Reasoning: ${reasoning}`);
          ui.notify("reasoning", { text: reasoning });
          
          console.log(`[${config.firmName}] Sending:`, JSON.stringify(reply));
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
    } catch (err: any) {
      console.error(`[${config.firmName}] Failed to accept session: ${err.message}`);
    }
  });

  synapse.onConnection(async (channel, from) => {
    console.log(`[${config.firmName}] Outbound connection established with: ${from}`);
    // This handles outbound connections if Agent B initiated one
  });
}

main();
