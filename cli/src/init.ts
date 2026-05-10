import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import { getProfilePath } from "./utils";

export async function init(options: { profile?: string }) {
  const profile = options.profile || "default";
  const walletPath = getProfilePath(profile);
  
  if (fs.existsSync(walletPath)) {
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log(`[CLI] Profile '${profile}' already exists at ${walletPath}`);
    console.log(`[CLI] Public Key: ${keypair.publicKey.toBase58()}`);
    return;
  }
  
  const keypair = Keypair.generate();
  fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)));
  console.log(`[CLI] Created new persistent identity for profile '${profile}' at ${walletPath}`);
  console.log(`[CLI] Public Key: ${keypair.publicKey.toBase58()}`);
  console.log(`[CLI] Fund this account on devnet using 'synapse airdrop --profile ${profile}'`);
}
