import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import { getWalletPath } from "./utils";

export async function init() {
  const walletPath = getWalletPath();
  if (fs.existsSync(walletPath)) {
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log(`[CLI] Wallet already exists at ${walletPath}`);
    console.log(`[CLI] Public Key: ${keypair.publicKey.toBase58()}`);
    return;
  }
  
  const keypair = Keypair.generate();
  fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)));
  console.log(`[CLI] Created new dev-wallet at ${walletPath}`);
  console.log(`[CLI] Public Key: ${keypair.publicKey.toBase58()}`);
  console.log(`[CLI] Run 'synapse airdrop' to fund it.`);
}
