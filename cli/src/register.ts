import { Keypair, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Synapse, SolanaRegistryAdapter, SolanaSignalingAdapter } from "@synapse/sdk";
import idl from "../../sdk/src/idl.json";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://api.devnet.solana.com";

export async function register(alias: string) {
  const walletPath = path.resolve(__dirname, "../../dev-wallet.json");
  if (!fs.existsSync(walletPath)) {
    throw new Error(`dev-wallet.json not found. Run 'synapse init' first.`);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(keypair), {
    commitment: "confirmed",
  });
  const program = new Program(idl as any, provider as any);

  const synapse = new Synapse({
    profile: "cli",
    keypair: keypair,
    registry: new SolanaRegistryAdapter(program as any),
    signaling: new SolanaSignalingAdapter(program as any),
  });

  await synapse.register(alias);
}
