import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import { getWalletPath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function balance() {
  const walletPath = getWalletPath();
  if (!fs.existsSync(walletPath)) {
    console.error(`[CLI] dev-wallet.json not found. Run 'synapse init' first.`);
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(RPC_URL, "confirmed");

  try {
    const bal = await connection.getBalance(keypair.publicKey);
    console.log(`[CLI] Public Key: ${keypair.publicKey.toBase58()}`);
    console.log(`[CLI] Balance: ${bal / LAMPORTS_PER_SOL} SOL`);
  } catch (err: any) {
    console.error(`[CLI] Failed to fetch balance: ${err.message}`);
    process.exit(1);
  }
}
