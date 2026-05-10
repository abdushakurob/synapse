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

    channel.onMessage(async (msg: any) => {
      // Schema validation
      if (!msg || typeof msg !== "object" || !msg.type) {
        console.warn(`[${config.firmName}] Invalid message format received.`);
        return;
      }
      
      const message = msg as Message;
      console.log(`[${config.firmName}] Received:`, JSON.stringify(message));
      ui.notify("message_received", { message });
      
      // State machine for negotiation
      switch (message.type) {
        case "quote":
          console.log(`[${config.firmName}] Evaluating quote: $${msg.price}`);
          // AI Logic would go here. For now, let's counter or accept.
          if (msg.price <= 0.45) {
             console.log(`[${config.firmName}] Price acceptable. Executing...`);
             channel.send({ type: "execution", asset: "SYN", quantity: msg.quantity, price: msg.price, agreed: true });
          } else {
              const counterPrice = 0.45;
              console.log(`[${config.firmName}] Price too high. Countering at $${counterPrice}`);
              const reply: Message = { type: "counter", asset: "SYN", quantity: msg.quantity, price: counterPrice };
              ui.notify("message_sent", { message: reply });
              channel.send(reply);
           }
          break;

        case "counter":
          console.log(`[${config.firmName}] Received counter: $${msg.price}`);
          // Simplified: accept if below 0.46
          if (msg.price <= 0.46) {
             const reply: Message = { type: "execution", asset: "SYN", quantity: msg.quantity, price: msg.price, agreed: true };
             ui.notify("message_sent", { message: reply });
             channel.send(reply);
          } else {
             const reply: Message = { type: "reject", reason: "Price out of range" };
             ui.notify("message_sent", { message: reply });
             channel.send(reply);
          }
          break;

        case "execution":
          console.log(`[${config.firmName}] TRADE EXECUTED: ${message.quantity} SYN @ $${message.price}`);
          ui.notify("portfolio_updated", { portfolio: { USDC: 500000 - (message.quantity * message.price), SYN: message.quantity } });
          break;

        case "reject":
          console.log(`[${config.firmName}] Negotiation rejected: ${msg.reason}`);
          break;

        case "status":
          console.log(`[${config.firmName}] Status: ${msg.message}`);
          break;
      }
    });

    // Initiate RFQ
    const rfq: Message = { type: "rfq", asset: "SYN", quantity: 500000, side: "buy" };
    console.log(`[${config.firmName}] Sending RFQ:`, JSON.stringify(rfq));
    ui.notify("message_sent", { message: rfq });
    channel.send(rfq);

    console.log(`[${config.firmName}] Interaction complete. Dashboard remains live.`);
    // Keep alive for demo inspection
    await new Promise(() => {}); 
  } catch (err: any) {
    console.error(`[${config.firmName}] Connection failed: ${err.message}`);
    process.exit(1);
  }
}

main();
