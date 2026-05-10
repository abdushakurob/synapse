import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import { getProfilePath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function airdrop(options: { profile?: string, amount?: string }) {
  const profile = options.profile || "default";
  const amount = parseFloat(options.amount || "2");
  const walletPath = getProfilePath(profile);

  if (!fs.existsSync(walletPath)) {
    console.error(`[CLI] Profile '${profile}' not found at ${walletPath}. Run 'synapse init --profile ${profile}' first.`);
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(RPC_URL, "confirmed");

  console.log(`[CLI] Requesting ${amount} Devnet SOL to ${keypair.publicKey.toBase58()} (Profile: ${profile})...`);
  try {
    const signature = await connection.requestAirdrop(keypair.publicKey, amount * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    console.log(`[CLI] Airdrop successful! Tx: ${signature}`);
  } catch (err: any) {
    console.error(`[CLI] Airdrop failed: ${err.message}`);
    process.exit(1);
  }
}
