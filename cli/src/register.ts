import { Keypair, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Synapse, SolanaRegistryAdapter, SolanaSignalingAdapter, IDL } from "@synapse-io/sdk";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { printKv, printNext } from "./cli-ui";
import { selectWallet, promptInput } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function register(alias: string | undefined, options: { 
  profile?: string, 
  file?: string,
  category?: string, 
  capabilities?: string[] 
}) {
  let identity;
  if (!options.profile && !options.file && process.stdin.isTTY) {
    const selected = await selectWallet("Select identity to register alias for");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    identity = { label: selected.label, walletPath: selected.path, keypair };
  } else {
    identity = resolveKeypair({ profile: options.profile, file: options.file });
  }

  let finalAlias = alias;
  if (!finalAlias && process.stdin.isTTY) {
    finalAlias = await promptInput("Enter on-chain alias (e.g. apex-capital)");
  }
  if (!finalAlias) throw new Error("Alias is required");

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(identity.keypair), {
    commitment: "confirmed",
  });
  const program = new Program(IDL as any, provider as any);

  const synapse = new Synapse({
    profile: identity.label,
    keypair: identity.keypair,
    registry: new SolanaRegistryAdapter(program as any),
    signaling: new SolanaSignalingAdapter(program as any),
  });

  await synapse.register(finalAlias, { 
    category: options.category, 
    capabilities: options.capabilities 
  });
  
  printKv("Registry Alias Registered", [
    ["Alias", finalAlias],
    ["Identity", identity.label],
    ["Public Key", identity.keypair.publicKey.toBase58()],
    ["Category", options.category || "general"],
    ["Capabilities", (options.capabilities || []).join(",") || "none"],
  ]);
  
  printNext([
    `synapse registry allow --open`,
    `synapse registry publish --category liquidity-provider`,
  ]);
}
