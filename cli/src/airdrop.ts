import { Connection, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { devnetTxUrl, parseOutputMode, printJson, printKv, printNext } from "./cli-ui";
import { selectWallet, promptAmount } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function airdrop(options: { profile?: string; file?: string; amount?: string; json?: boolean }) {
  const output = parseOutputMode(options.json);
  
  let identity;
  if (!options.profile && !options.file && output === "text") {
    const selected = await selectWallet("Select identity for airdrop");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    identity = { label: selected.label, walletPath: selected.path, keypair };
  } else {
    identity = resolveKeypair({ profile: options.profile, file: options.file });
  }

  let amountSolInput = options.amount;
  if (!amountSolInput && output === "text") {
    amountSolInput = await promptAmount("Amount of SOL to request", "2");
  }
  
  const amountSol = Number(amountSolInput || "2");
  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error(`Invalid amount '${amountSolInput}'. Provide a positive number.`);
  }
  
  const connection = new Connection(RPC_URL, "confirmed");

  if (output === "text") {
    printKv("Airdrop (devnet)", [
      ["Identity", identity.label],
      ["Public Key", identity.keypair.publicKey.toBase58()],
      ["Amount", `${amountSol} SOL`],
    ]);
  }

  const signature = await connection.requestAirdrop(identity.keypair.publicKey, amountSol * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(signature);

  if (output === "json") {
    printJson({
      ok: true,
      network: "devnet",
      identity: identity.label,
      publicKey: identity.keypair.publicKey.toBase58(),
      amountSol: amountSol,
      signature,
      explorer: devnetTxUrl(signature),
    });
    return;
  }

  printKv("Airdrop confirmed", [
    ["Signature", signature],
    ["Explorer", devnetTxUrl(signature)],
  ]);
  printNext([
    `synapse wallet balance --profile ${identity.label.split(":").pop()}`,
    "synapse account list",
  ]);
}
