import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import { getWalletPath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function airdrop() {
  const walletPath = getWalletPath();
  if (!fs.existsSync(walletPath)) {
    console.error(`[CLI] dev-wallet.json not found. Run 'synapse init' first.`);
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(RPC_URL, "confirmed");

  console.log(`[CLI] Requesting 2 SOL airdrop to ${keypair.publicKey.toBase58()}...`);
  try {
    const signature = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    });
    console.log(`[CLI] Airdrop successful! Tx: ${signature}`);
  } catch (err: any) {
    console.error(`[CLI] Airdrop failed: ${err.message}`);
    process.exit(1);
  }
}
