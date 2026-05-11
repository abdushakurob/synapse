import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { printKv, parseOutputMode, printJson } from "./cli-ui";
import { selectWallet } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function balance(options: { profile?: string, file?: string, json?: boolean }) {
  const output = parseOutputMode(options.json);
  
  let walletPath: string;
  let label: string;
  let keypair: Keypair;

  if (!options.profile && !options.file && output === "text") {
    const selected = await selectWallet("Check balance for");
    walletPath = selected.path;
    label = selected.label;
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  } else {
    const resolved = resolveKeypair({ profile: options.profile, file: options.file });
    walletPath = resolved.walletPath;
    label = resolved.label;
    keypair = resolved.keypair;
  }

  const connection = new Connection(RPC_URL, "confirmed");

  try {
    const balance = await connection.getBalance(keypair.publicKey);
    
    if (output === "json") {
      printJson({
        ok: true,
        network: "devnet",
        identity: label,
        publicKey: keypair.publicKey.toBase58(),
        balanceSol: balance / LAMPORTS_PER_SOL
      });
      return;
    }

    printKv(`Balance for ${label}`, [
      ["Public Key", keypair.publicKey.toBase58()],
      ["Balance", `${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`],
    ]);
  } catch (err: any) {
    console.error(`[CLI] Failed to fetch balance: ${err.message}`);
  }
}
