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

      channel.onMessage(async (msg: any) => {
        // Schema validation
        if (!msg || typeof msg !== "object" || !msg.type) {
          console.warn(`[${config.firmName}] Invalid message format received.`);
          return;
        }

        const message = msg as Message;
        console.log(`[${config.firmName}] Received:`, JSON.stringify(message));
        ui.notify("message_received", { message });

        switch (message.type) {
          case "rfq":
            console.log(`[${config.firmName}] Processing RFQ for ${msg.quantity} ${msg.asset}`);
            const quote: Message = { 
              type: "quote", 
              asset: msg.asset, 
              quantity: msg.quantity, 
              price: 0.47, 
              expiresIn: 60 
            };
            console.log(`[${config.firmName}] Sending Quote: $${quote.price}`);
            ui.notify("message_sent", { message: quote });
            channel.send(quote);
            break;

          case "counter":
            console.log(`[${config.firmName}] Evaluating counter: $${message.price}`);
            if (message.price >= 0.45) {
               const finalPrice = 0.455;
               console.log(`[${config.firmName}] Counter acceptable. Proposing final price: $${finalPrice}`);
               const reply: Message = { type: "counter", asset: "SYN", quantity: message.quantity, price: finalPrice };
               ui.notify("message_sent", { message: reply });
               channel.send(reply);
            } else {
               const reply: Message = { type: "reject", reason: "Price too low" };
               ui.notify("message_sent", { message: reply });
               channel.send(reply);
            }
            break;

          case "execution":
            if (message.agreed) {
              console.log(`[${config.firmName}] CONFIRMED: Sold ${message.quantity} SYN @ $${message.price}`);
              ui.notify("portfolio_updated", { portfolio: { USDC: message.quantity * message.price, SYN: 2000000 - message.quantity } });
              channel.send({ type: "status", message: "Trade confirmed. Session remains open for inspection." });
            }
            break;

          case "reject":
            console.log(`[${config.firmName}] Client rejected: ${msg.reason}`);
            break;
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
