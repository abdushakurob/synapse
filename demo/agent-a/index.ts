import {
  Synapse,
  SolanaRegistryAdapter,
  SolanaSignalingAdapter,
} from "@synapse-io/sdk";
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
    if (!err.message.includes("already registered")) {
      process.exit(1);
    }
  }

  const history: ChatMessage[] = [];

  // Wait for the UI to send a 'start' command to initiate connection AND negotiation
  ui.onMessage(async (msg: any) => {
    if (msg.type === "start") {
      console.log(`[${config.firmName}] Start signal received. Initiating P2P connection...`);
      ui.notify("status", { message: "Initiating encrypted P2P handshake via Solana..." });

      try {
        const channel = await synapse.connect("meridian-trading");
        const activeSessions = synapse.sessions.list();
        const sessionPDA = activeSessions.find(s => s.direction === "outbound")?.sessionPDA || "Unknown";
        
        console.log(`[${config.firmName}] Connected to Meridian Trading.`);
        ui.notify("session_opened", { remoteFirm: "Meridian Trading", sessionPDA });
        ui.notify("status", { message: "P2P Channel Secure. Starting autonomous negotiation..." });

        channel.onMessage(async (msg: any) => {
          if (!msg || typeof msg !== "object" || !msg.type) return;
          
          const message = msg as Message;
          console.log(`[${config.firmName}] Received:`, JSON.stringify(message));
          ui.notify("message_received", { message });
          history.push({ role: "user", content: JSON.stringify(message) });

          if (message.type === "execution") {
            console.log(`[${config.firmName}] TRADE EXECUTED: ${message.quantity} SYN @ $${message.price}`);
            config.portfolio.USDC -= (message.quantity * message.price);
            config.portfolio.SYN += message.quantity;
            ui.notify("portfolio_updated", { portfolio: config.portfolio });
            return;
          }

          // Generate response using Together AI
          try {
            console.log(`[${config.firmName}] Thinking...`);
            const { reasoning, message: reply } = await generateAgentResponse(config.systemPrompt, history, config.portfolio);
            
            ui.notify("reasoning", { text: reasoning });
            ui.notify("message_sent", { message: reply });
            channel.send(reply);
            history.push({ role: "assistant", content: JSON.stringify(reply) });

            if (reply.type === "execution" && reply.agreed) {
               config.portfolio.USDC -= (reply.quantity * reply.price);
               config.portfolio.SYN += reply.quantity;
               ui.notify("portfolio_updated", { portfolio: config.portfolio });
            }
          } catch (err: any) {
            console.error(`[${config.firmName}] LLM Error:`, err.message);
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
