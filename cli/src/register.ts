import { Keypair, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Synapse, SolanaRegistryAdapter, SolanaSignalingAdapter, IDL } from "@synapse-io/sdk";
import * as fs from "fs";
import { getProfilePath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function register(alias: string, options: { 
  profile: string, 
  category?: string, 
  capabilities?: string[] 
}) {
  const profile = options.profile || "default";
  const walletPath = getProfilePath(profile);

  if (!fs.existsSync(walletPath)) {
    throw new Error(`Profile '${profile}' not found. Run 'synapse init --profile ${profile}' first.`);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(keypair), {
    commitment: "confirmed",
  });
  const program = new Program(IDL as any, provider as any);

  const synapse = new Synapse({
    profile,
    keypair: keypair,
    registry: new SolanaRegistryAdapter(program as any),
    signaling: new SolanaSignalingAdapter(program as any),
  });

  console.log(`[CLI] Registering "${alias}" (Profile: ${profile}) for public key: ${keypair.publicKey.toBase58()}`);
  await synapse.register(alias, { 
    category: options.category, 
    capabilities: options.capabilities 
  });
}
