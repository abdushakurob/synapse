import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { getProfilePath } from "./utils";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../../sdk/src/idl.json";

const RPC_URL = "https://api.devnet.solana.com";

export async function publish(options: { 
  profile: string, 
  category?: string, 
  capabilities?: string[] 
}) {
  const walletPath = getProfilePath(options.profile);
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Profile '${options.profile}' not found.`);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);

  const [registryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), Buffer.from(await getAlias(program, keypair.publicKey))],
    program.programId
  );

  const registry = await (program.account as any).agentRegistry.fetch(registryPDA);

  console.log(`[CLI] Publishing metadata for ${options.profile}...`);

  const signature = await (program.methods as any)
    .configureAgent(
      registry.acceptList,
      registry.isOpen,
      options.category || null,
      options.capabilities || null
    )
    .accounts({
      agentRegistry: registryPDA,
      owner: keypair.publicKey,
    })
    .rpc();

  console.log(`[CLI] Metadata published! Discovery updated. Tx: ${signature}`);
}

async function getAlias(program: Program<any>, owner: PublicKey): Promise<string> {
  const accounts = await (program.account as any).agentRegistry.all([
    { memcmp: { offset: 8 + 4 + 32, bytes: owner.toBase58() } }
  ]);
  if (accounts.length === 0) throw new Error("This profile is not registered on-chain yet.");
  return accounts[0].account.alias;
}
