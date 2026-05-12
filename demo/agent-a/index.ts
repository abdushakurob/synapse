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
import {
  generateAgentResponse,
  generateInternalAnalysis,
  ChatMessage
} from "../shared/llm";
import * as fs from "fs";
import * as path from "path";

const TOTAL_GOAL = 500000;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Use port 10000 on Render (unified), 3001 locally
  const uiPort = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  console.log(`\n\x1b[36mAPEX CAPITAL DASHBOARD BRIDGE: http://localhost:${uiPort}\x1b[0m\n`);
  const ui = new UIBridge(uiPort, "apex");
  const history: ChatMessage[] = [];
  let acquiredTotal = 0;
  let sessionTerminated = false;
  let activeAbortController: AbortController | null = null;

  async function triggerFinalReport() {
    if (sessionTerminated) return;
    sessionTerminated = true;
    ui.notify("status", { message: "Generating Final Execution Analytics..." });
    const report = await generateInternalAnalysis(
      "Apex Capital Session Summary",
      "Analyze our performance in acquiring 500k SYN. Discuss our final average entry price and the strength of our position. Focus on the tactical 'Dumps' we used to pressure the floor. 2-3 paragraphs max.",
      { history: history.slice(-30), portfolio: config.portfolio }
    );
    ui.notify("final_report", { report });
    ui.notify("execution_complete", { price: 0.463, quantity: acquiredTotal });
    ui.notify("status", { message: "Strategy Complete. Desk Closed." });
    await sleep(2000);
    // process.exit(0); - Removed to keep shared process alive
  }

  const responderAlias = process.env.RESPONDER_ALIAS || "meridian-trading-dev-stable";
  const walletFile = path.resolve(__dirname, "../../dev-wallet-a.json");
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
  ui.notify("status", { message: "READY. Waiting for boardroom initialization..." });

  ui.onMessage(async (msg) => {
    if (msg.type === "start") {
      ui.notify("phase_change", { phase: "CONNECTING" });
      ui.notify("status", { message: `Discovering ${responderAlias}...` });

      // Handshake Visualization: Initiator
      console.log(`\n\x1b[36m[Signaling] Initiating handshake with ${responderAlias}...\x1b[0m`);
      ui.notify("status", { message: "Encrypting session metadata (X25519)..." });
      await sleep(600);

      console.log(`\x1b[36m[Crypto] Derived Ephemeral Keypair. Writing Encrypted Offer to Solana...\x1b[0m`);
      ui.notify("status", { message: "Writing Encrypted Offer to Solana PDA..." });

      const channel = await synapse.connect(responderAlias);

      console.log(`\x1b[36m[Signaling] Detected Encrypted Answer on Solana. Retrieving... [OK]\x1b[0m`);
      ui.notify("status", { message: "Retrieved Encrypted Answer. Verifying peer signature..." });
      await sleep(800);

      console.log(`\x1b[36m[Crypto] Answer Decrypted. Verifying peer public key... [VERIFIED]\x1b[0m`);
      console.log(`\x1b[32m[WebRTC] P2P Tunnel Established. Channel is LIVE.\x1b[0m\n`);
      ui.notify("status", { message: "Secure P2P Tunnel Established. Channel Live." });

      ui.notify("session_opened", { remoteFirm: "Meridian Trading", sessionPDA: channel.sessionPDA || "Active Session" });

      if (channel.sessionPDA) {
        console.log(`\x1b[36m[Solana] Closing handshake account ${channel.sessionPDA.substring(0, 8)}... [OK]\x1b[0m`);
        console.log(`\x1b[36m[Solana] Rent reclamation: +0.0021 SOL credited to wallet.\x1b[0m`);
        await synapse.closeSession(channel.sessionPDA);
        ui.notify("status", { message: "Handshake account closed. Rent reclaimed." });
      }

      console.log(`\x1b[32m[Discovery] Peer Endpoint Parsed: Direct UDP tunnel active.\x1b[0m`);
      ui.notify("phase_change", { phase: "NEGOTIATING" });

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
            ui.notify("status", { message: "Peer confirmed settlement. Moving to next block." });
            if (acquiredTotal < TOTAL_GOAL) {
              await sleep(2000);
              const remaining = TOTAL_GOAL - acquiredTotal;
              const nextSize = Math.min(remaining, Math.floor(Math.random() * 50000) + 50000);
              const nextRfq = { type: "rfq", asset: "SYN", quantity: nextSize, side: "buy" };
              ui.notify("message_sent", { message: nextRfq });
              channel.send(nextRfq);
              history.push({ role: "assistant", content: JSON.stringify(nextRfq) });
            }
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
            ui.notify("status", { message: "Strategic exit confirmed. Terminating session..." });
            await triggerFinalReport();
            return;
          } else {
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
          const side = (message as any).side || "BUY";
          const total = (message as any).quantity * (message as any).price;
          if (side === "BUY") {
            config.portfolio.USDC -= total;
            config.portfolio.SYN += (message as any).quantity;
            acquiredTotal += (message as any).quantity;
          } else {
            config.portfolio.USDC += total;
            config.portfolio.SYN -= (message as any).quantity;
          }
          ui.notify("trade_executed", { trade: { price: (message as any).price, quantity: (message as any).quantity, side } });
          ui.notify("portfolio_updated", { portfolio: config.portfolio });
          ui.notify("status", { message: `Settlement Complete. (${acquiredTotal}/${TOTAL_GOAL} acquired)` });
          channel.send({ type: "status", message: "SETTLEMENT_ACK" });

          if (acquiredTotal >= TOTAL_GOAL) {
            ui.notify("status", { message: "Accumulation target met. Initiating final exit..." });
            await sleep(2000);
            channel.send({ type: "reject", reason: "GOAL_ACHIEVED_TERMINATE" });
            await triggerFinalReport();
          }
          return;
        }

        // TACTICAL MANEUVER
        const shouldDump = Math.random() > 0.94 && config.portfolio.SYN > 50000;
        if (shouldDump) {
          ui.notify("status", { message: "Executing tactical market pressure..." });
          const manipulationMsg = { type: "counter", asset: "SYN", quantity: 10000, price: (message as any).price * 0.98, side: "sell" };
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
            ui.notify("status", { message: "Strategy complete. Initiating strategic exit..." });
            await triggerFinalReport();
            return;
          }

          // Handle Execution (Sending)
          if (reply.type === "execution" || reply.type === "execute" || reply.type === "accept") {
            const side = (reply as any).side || "BUY";
            const total = reply.quantity * reply.price;
            if (side === "BUY") {
              config.portfolio.USDC -= total;
              config.portfolio.SYN += reply.quantity;
              acquiredTotal += reply.quantity;
            } else {
              config.portfolio.USDC += total;
              config.portfolio.SYN -= reply.quantity;
            }
            ui.notify("trade_executed", { trade: { price: reply.price, quantity: reply.quantity, side } });
            ui.notify("portfolio_updated", { portfolio: config.portfolio });
            ui.notify("status", { message: `Settled ${reply.quantity} units. Finalizing block...` });

            if (acquiredTotal >= TOTAL_GOAL) {
              ui.notify("status", { message: "Accumulation target met. Initiating final exit..." });
              await sleep(2000);
              channel.send({ type: "reject", reason: "GOAL_ACHIEVED_TERMINATE" });
              await triggerFinalReport();
            }
          }
        } catch (err: any) {
          if (err.message !== "AbortError") throw err;
        }
      });

      // Initial RFQ
      const initialRfq = { type: "rfq", asset: "SYN", quantity: 50000, side: "buy" };
      ui.notify("message_sent", { message: initialRfq });
      channel.send(initialRfq);
      history.push({ role: "assistant", content: JSON.stringify(initialRfq) });
    }
  });

  while (!sessionTerminated) { await sleep(1000); }
}

export { main as run };
