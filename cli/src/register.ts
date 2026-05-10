import { Keypair, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Synapse, SolanaRegistryAdapter, SolanaSignalingAdapter, IDL } from "@synapse-io/sdk";
import * as fs from "fs";
import { getWalletPath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function register(alias: string) {
  const walletPath = getWalletPath();
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet not found. Run 'synapse init' first.`);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(keypair), {
    commitment: "confirmed",
  });
  const program = new Program(IDL as any, provider as any);

  const synapse = new Synapse({
    profile: "cli",
    keypair: keypair,
    registry: new SolanaRegistryAdapter(program as any),
    signaling: new SolanaSignalingAdapter(program as any),
  });

  console.log(`[CLI] Registering "${alias}" for public key: ${keypair.publicKey.toBase58()}`);
  await synapse.register(alias);
  console.log(`[CLI] Successfully registered alias "${alias}" on Solana.`);
}
