import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import { getProfilePath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function balance(options: { profile?: string }) {
  const profile = options.profile || "default";
  const walletPath = getProfilePath(profile);

  if (!fs.existsSync(walletPath)) {
    console.error(`[CLI] Profile '${profile}' not found. Run 'synapse init --profile ${profile}' first.`);
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(RPC_URL, "confirmed");

  try {
    const bal = await connection.getBalance(keypair.publicKey);
    console.log(`[CLI] Profile:  ${profile}`);
    console.log(`[CLI] Identity: ${keypair.publicKey.toBase58()}`);
    console.log(`[CLI] Balance:  ${bal / LAMPORTS_PER_SOL} SOL (Devnet)`);
  } catch (err: any) {
    console.error(`[CLI] Failed to fetch balance: ${err.message}`);
    process.exit(1);
  }
}
