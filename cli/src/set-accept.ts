import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { getProfilePath } from "./utils";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../../sdk/src/idl.json";

const RPC_URL = "https://api.devnet.solana.com";

export async function setAccept(aliases: string[], options: { profile: string, open: boolean }) {
  const walletPath = getProfilePath(options.profile);
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Profile '${options.profile}' not found.`);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);

  const pubkeys: PublicKey[] = [];
  for (const item of aliases) {
    try {
      if (item.length > 32 && !item.includes("-")) {
        pubkeys.push(new PublicKey(item));
      } else {
        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from("agent"), Buffer.from(item)],
          program.programId
        );
        const account = await (program.account as any).agentRegistry.fetch(pda);
        pubkeys.push(account.owner);
      }
    } catch (err) {
      console.warn(`[CLI] Warning: Could not resolve alias '${item}' to an on-chain identity.`);
    }
  }

  console.log(`[CLI] Updating Agentic Firewall for ${options.profile}...`);
  console.log(`[CLI] Open mode: ${options.open}`);
  console.log(`[CLI] Authorized: ${pubkeys.length} agent(s)`);

  const [registryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), Buffer.from(await getAlias(program, keypair.publicKey))],
    program.programId
  );

  const signature = await (program.methods as any)
    .configureAgent(
      pubkeys,
      options.open,
      null, // category (no change)
      null  // capabilities (no change)
    )
    .accounts({
      agentRegistry: registryPDA,
      owner: keypair.publicKey,
    })
    .rpc();

  console.log(`[CLI] Firewall updated successfully! Tx: ${signature}`);
}

async function getAlias(program: Program<any>, owner: PublicKey): Promise<string> {
  const accounts = await (program.account as any).agentRegistry.all([
    { memcmp: { offset: 8 + 4 + 32, bytes: owner.toBase58() } }
  ]);
  if (accounts.length === 0) throw new Error("This profile is not registered on-chain yet.");
  return accounts[0].account.alias;
}
