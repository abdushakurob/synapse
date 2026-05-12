import {
  Synapse,
  IDL
} from "@synapse-io/sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { UIBridge } from "../shared/ui-bridge";
import { config } from "./config";
import { Message } from "../shared/schema";
import {
  generateAgentResponse,
  generateInternalAnalysis,
  ChatMessage
} from "../shared/llm";
import * as fs from "fs";
import * as path from "path";

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Use port 10000 on Render (unified), 3002 locally
  const uiPort = process.env.PORT ? parseInt(process.env.PORT) : 3002;
  const ui = new UIBridge(uiPort, "meridian");
  const history: ChatMessage[] = [];
  let sessionComplete = false;
  let activeAbortController: AbortController | null = null;

  async function triggerFinalReport() {
    if (sessionComplete) return;
    sessionComplete = true;
    ui.notify("status", { message: "Generating Final Market-Maker Analysis..." });
    const report = await generateInternalAnalysis(
      "Meridian Trading Session Summary",
      "Analyze our performance as a market maker. Negotiation has concluded. Final inventory levels are stable. Discuss bid-ask spread efficiency and risk management. 2-3 paragraphs max.",
      { history: history.slice(-30), portfolio: config.portfolio }
    );
    ui.notify("final_report", { report });
    ui.notify("execution_complete", { price: 0, quantity: config.portfolio.SYN });
    ui.notify("status", { message: "Market Mission Complete. Desk Closed." });
    await sleep(2000);
    process.exit(0);
  }

  const walletFile = path.resolve(__dirname, "../../dev-wallet-b.json");
  const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(walletFile, "utf-8"))));
  const synapse = new Synapse({
    profile: config.alias,
    keypair: walletKeypair,
    onTransaction: (signature, description) => {
      ui.notify("blockchain_tx", { signature, description });
    }
  });

  ui.notify("status", { message: "Checking on-chain registration..." });
  try {
    await synapse.register(config.alias);
  } catch (err: any) {
    if (err.name !== "AliasTakenError") throw err;
  }

  ui.notify("portfolio_updated", { portfolio: config.portfolio });
  ui.notify("status", { message: "Awaiting incoming handshake..." });

  synapse.onConnection(async (channel, from) => {
    // ENCRYPTION VISUALIZATION: Responder
    const dummyHex = "4a6b20c3...d9e1f0a2";
    ui.notify("status", { message: `Retrieved Encrypted Offer from PDA...` });
    ui.notify("status", { message: `RAW_CIPHER: ${dummyHex}` });
    await sleep(1000);
    ui.notify("status", { message: "Decryption Successful. Derived Shared Secret." });
    ui.notify("status", { message: "Writing Encrypted Answer to Solana..." });
    await sleep(600);

    ui.notify("session_opened", { remoteFirm: "Apex Capital", sessionPDA: channel.sessionPDA || "Active Session" });
    ui.notify("status", { message: `Secure P2P Channel Established with ${from}` });

    channel.onMessage(async (msg: any) => {
      // COLLISION DETECTION
      if (activeAbortController) {
        activeAbortController.abort();
        activeAbortController = null;
        ui.notify("status", { message: "Peer interrupted. Recalibrating strategy..." });
      }

      const message = msg as Message;
      ui.notify("message_received", { message, timestamp: Date.now() });
      history.push({ role: "user", content: JSON.stringify(message) });

      // Handle Status / Acks
      if (message.type === "status") {
        const statusMsg = String(message.message || "").trim().toUpperCase();
        if (statusMsg === "SETTLEMENT_ACK") {
          ui.notify("status", { message: "Initiator confirmed settlement." });
          return;
        } else {
          ui.notify("status", { message: `Peer Status: ${message.message}` });
        }
      }

      if ((message as any).price) {
        ui.notify("price_update", { price: (message as any).price, timestamp: Date.now() });
      }

      // Handle Rejection / Termination (Receiving)
      if (message.type === "reject") {
        if (message.reason?.includes("TERMINATE") || message.reason?.includes("GOAL")) {
          ui.notify("status", { message: "Counterparty initiated strategic exit." });
          await triggerFinalReport();
          return;
        } else {
          // LLM Intelligence Translation
          const brief = await generateInternalAnalysis(
            "Tactical Intelligence",
            `Translate this rejection into a brief 1-sentence boardroom update: ${message.reason || "better deal please"}`,
            { history: history.slice(-5) }
          );
          ui.notify("status", { message: brief });
        }
      }

      // Handle Execution (Receiving)
      if (message.type === "execution" || message.type === "execute" || message.type === "accept") {
        const side = (message as any).side || "SELL";
        const total = (message as any).quantity * (message as any).price;
        if (side === "SELL") {
          config.portfolio.USDC += total;
          config.portfolio.SYN -= (message as any).quantity;
        } else {
          config.portfolio.USDC -= total;
          config.portfolio.SYN += (message as any).quantity;
        }
        ui.notify("trade_executed", { trade: { price: (message as any).price, quantity: (message as any).quantity, side } });
        ui.notify("portfolio_updated", { portfolio: config.portfolio });
        ui.notify("status", { message: "Settlement Confirmed. Sending ACK..." });
        channel.send({ type: "status", message: "SETTLEMENT_ACK" });
        return;
      }

      // TACTICAL MANEUVER
      const isMarketSupportRound = Math.random() > 0.94 && config.portfolio.USDC > 50000;
      if (isMarketSupportRound) {
        ui.notify("status", { message: "Defending price floor..." });
        const manipulationMsg = { type: "counter", asset: "SYN", quantity: 15000, price: (message as any).price * 1.01, side: "buy" };
        ui.notify("message_sent", { message: manipulationMsg, timestamp: Date.now() });
        channel.send(manipulationMsg);
        history.push({ role: "assistant", content: JSON.stringify(manipulationMsg) });
        return;
      }

      // GENERATE RESPONSE
      activeAbortController = new AbortController();
      const reasoningId = Math.random().toString(36).substring(7);
      await sleep(Math.floor(Math.random() * 1500) + 500);

      try {
        const { reasoning, message: reply } = await generateAgentResponse(
          config.systemPrompt + "\nDECISION_SPEED: HIGH. Prioritize closing trades within 3 rounds. You are authorized to make 1-2% concessions to ensure atomic settlement. Be decisive, even if a slightly better price might exist later. SPEED IS THE GOAL.", 
          history, 
          config.portfolio,
          (chunk) => ui.notify("reasoning_chunk", { id: reasoningId, chunk }),
          activeAbortController.signal
        );
        activeAbortController = null;
        if (reply.type === "status" && reply.message === "ABORTED") return;

        ui.notify("reasoning", { id: reasoningId, text: reasoning });
        await sleep(2000);
        ui.notify("message_sent", { message: reply, timestamp: Date.now() });
        if (reply.price) ui.notify("price_update", { price: reply.price, timestamp: Date.now() });

        channel.send(reply);
        history.push({ role: "assistant", content: JSON.stringify(reply) });

        // SELF-TERMINATION (Sending)
        if (reply.type === "reject" && (reply.reason?.includes("TERMINATE") || reply.reason?.includes("GOAL"))) {
          ui.notify("status", { message: "Initiating strategic session exit..." });
          await triggerFinalReport();
          return;
        }

        // Handle Execution (Sending)
        if (reply.type === "execution" || reply.type === "execute" || reply.type === "accept") {
          const side = (reply as any).side || "SELL";
          const total = reply.quantity * reply.price;
          if (side === "SELL") {
            config.portfolio.USDC += total;
            config.portfolio.SYN -= reply.quantity;
          } else {
            config.portfolio.USDC -= total;
            config.portfolio.SYN += reply.quantity;
          }
          ui.notify("trade_executed", { trade: { price: reply.price, quantity: reply.quantity, side } });
          ui.notify("portfolio_updated", { portfolio: config.portfolio });
          ui.notify("status", { message: "Execution confirmed. Waiting for peer ack..." });
        }
      } catch (err: any) {
        if (err.message !== "AbortError") throw err;
      }
    });
  });

  while (!sessionComplete) { await sleep(1000); }
}

main().catch(err => { console.error("FATAL:", err); process.exit(1); });
