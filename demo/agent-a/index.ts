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
  const ui = new UIBridge(3001);
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
      process.exit(1);
    }
  }

  // We wait for B to be ready in this demo script
  console.log(`[${config.firmName}] Waiting for Meridian Trading...`);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    console.log(`[${config.firmName}] Connecting to Meridian Trading...`);
    const channel = await synapse.connect("meridian-trading");
    const activeSessions = synapse.sessions.list();
    // Agent A initiated the connection, so it's the outbound one
    const sessionPDA = activeSessions.find(s => s.direction === "outbound")?.sessionPDA || "Unknown";
    console.log(`[${config.firmName}] Connected to Meridian Trading.`);
    ui.notify("session_opened", { remoteFirm: "Meridian Trading", sessionPDA });
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
      
      // Add incoming message to history
      history.push({ role: "user", content: JSON.stringify(message) });

      // Handle execution updates to portfolio locally without needing LLM permission
      if (message.type === "execution") {
        console.log(`[${config.firmName}] TRADE EXECUTED: ${message.quantity} SYN @ $${message.price}`);
        config.portfolio.USDC -= (message.quantity * message.price);
        config.portfolio.SYN += message.quantity;
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
        return;
      }

      if (message.type === "reject") {
        console.log(`[${config.firmName}] Negotiation rejected: ${message.reason}`);
        return;
      }

      if (message.type === "status") {
        console.log(`[${config.firmName}] Status: ${message.message}`);
        return;
      }

      // Generate response using Together AI
      try {
        console.log(`[${config.firmName}] Thinking...`);
        const { reasoning, message: reply } = await generateAgentResponse(config.systemPrompt, history, config.portfolio);
        
        console.log(`[${config.firmName}] Reasoning: ${reasoning}`);
        ui.notify("reasoning", { text: reasoning });
        
        console.log(`[${config.firmName}] Sending:`, JSON.stringify(reply));
        ui.notify("message_sent", { message: reply });
        channel.send(reply);
        
        history.push({ role: "assistant", content: JSON.stringify(reply) });

        // Update local portfolio if WE just sent an execution
        if (reply.type === "execution" && reply.agreed) {
           config.portfolio.USDC -= (reply.quantity * reply.price);
           config.portfolio.SYN += reply.quantity;
           ui.notify("portfolio_updated", { portfolio: config.portfolio });
        }
      } catch (err: any) {
        console.error(`[${config.firmName}] LLM Error:`, err.message);
      }
    });

    // Wait for the UI to send a 'start' command before initiating the RFQ
    ui.onMessage(async (msg: any) => {
      if (msg.type === "start") {
        console.log(`[${config.firmName}] Start signal received from UI. Initiating negotiation.`);
        ui.notify("status", { message: "Autonomous negotiation triggered..." });
        
        const initialPrompt = "Generate the initial Request for Quote (RFQ) to buy 500000 SYN.";
        history.push({ role: "user", content: initialPrompt });
        
        try {
          const { reasoning, message: rfq } = await generateAgentResponse(config.systemPrompt, history, config.portfolio);
          
          console.log(`[${config.firmName}] Reasoning: ${reasoning}`);
          ui.notify("reasoning", { text: reasoning });
          
          console.log(`[${config.firmName}] Sending RFQ:`, JSON.stringify(rfq));
          ui.notify("message_sent", { message: rfq });
          channel.send(rfq);
          history.push({ role: "assistant", content: JSON.stringify(rfq) });
        } catch (err: any) {
           console.error(`[${config.firmName}] Failed to generate RFQ:`, err.message);
        }
      }
    });

    console.log(`[${config.firmName}] Connected. Waiting for user to press Start on dashboard...`);
    // Keep alive for demo inspection
    await new Promise(() => {}); 
  } catch (err: any) {
    console.error(`[${config.firmName}] Connection failed: ${err.message}`);
    process.exit(1);
  }
}

main();
