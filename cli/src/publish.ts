import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL } from "@synapse-io/sdk";
import { devnetTxUrl, printKv, printNext } from "./cli-ui";
import { selectWallet, promptInput } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function publish(options: { 
  profile?: string, 
  file?: string,
  category?: string, 
  capabilities?: string[] 
}) {
  let identity;
  if (!options.profile && !options.file && process.stdin.isTTY) {
    const selected = await selectWallet("Select identity to update metadata");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    identity = { label: selected.label, walletPath: selected.path, keypair };
  } else {
    identity = resolveKeypair({ profile: options.profile, file: options.file });
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(identity.keypair), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);

  const [registryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), Buffer.from(await getAlias(program, identity.keypair.publicKey))],
    program.programId
  );

  const registry = await (program.account as any).agentRegistry.fetch(registryPDA);

  let finalCategory = options.category;
  if (!finalCategory && process.stdin.isTTY) {
    finalCategory = await promptInput("Enter new category", registry.category || "general");
  }

  let finalCaps = options.capabilities;
  if (!finalCaps && process.stdin.isTTY) {
    const input = await promptInput("Enter capabilities (comma separated)", (registry.capabilities || []).join(","));
    if (input) {
      finalCaps = input.split(",").map(s => s.trim()).filter(Boolean);
    }
  }

  const signature = await (program.methods as any)
    .configureAgent(
      registry.acceptList,
      registry.isOpen,
      finalCategory || null,
      finalCaps || null
    )
    .accounts({
      agentRegistry: registryPDA,
      owner: identity.keypair.publicKey,
    })
    .rpc();

  printKv("Registry Metadata Published", [
    ["Identity", identity.label],
    ["Category", finalCategory || registry.category || "general"],
    ["Capabilities", (finalCaps || registry.capabilities || []).join(",") || "none"],
    ["Signature", signature],
    ["Explorer", devnetTxUrl(signature)],
  ]);
  
  printNext([
    `synapse account show --profile ${identity.label.split(":").pop()}`,
  ]);
}

async function getAlias(program: Program<any>, owner: PublicKey): Promise<string> {
  const accounts = await (program.account as any).agentRegistry.all([
    { memcmp: { offset: 8 + 4 + 32, bytes: owner.toBase58() } }
  ]);
  if (accounts.length === 0) throw new Error("This profile is not registered on-chain yet.");
  return accounts[0].account.alias;
}
