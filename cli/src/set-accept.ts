import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL } from "@synapse-io/sdk";
import { devnetTxUrl, printKv, printList } from "./cli-ui";
import { selectWallet, promptInput } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function setAccept(aliases: string[], options: { profile?: string, file?: string, open: boolean }) {
  let identity;
  if (!options.profile && !options.file && process.stdin.isTTY) {
    const selected = await selectWallet("Select identity to update allowlist");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    identity = { label: selected.label, walletPath: selected.path, keypair };
  } else {
    identity = resolveKeypair({ profile: options.profile, file: options.file });
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(identity.keypair), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);

  const finalAliases = [...aliases];
  if (finalAliases.length === 0 && !options.open && process.stdin.isTTY) {
    const input = await promptInput("Enter allowed aliases/pubkeys (comma separated)");
    if (input) {
      input.split(",").forEach(s => finalAliases.push(s.trim()));
    }
  }

  const pubkeys: PublicKey[] = [];
  for (const item of finalAliases) {
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
      console.warn(`[Synapse] Could not resolve '${item}' to an on-chain identity.`);
    }
  }

  const [registryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), Buffer.from(await getAlias(program, identity.keypair.publicKey))],
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
      owner: identity.keypair.publicKey,
    })
    .rpc();

  printKv("Registry allowlist updated", [
    ["Identity", identity.label],
    ["Open Mode", options.open ? "ON (Accept all)" : "OFF (Restricted)"],
    ["Authorized Keys", `${pubkeys.length}`],
    ["Signature", signature],
    ["Explorer", devnetTxUrl(signature)],
  ]);
  
  if (finalAliases.length > 0) {
    printList("Authorized Entities", finalAliases);
  }
}

async function getAlias(program: Program<any>, owner: PublicKey): Promise<string> {
  const accounts = await (program.account as any).agentRegistry.all([
    { memcmp: { offset: 8 + 4 + 32, bytes: owner.toBase58() } }
  ]);
  if (accounts.length === 0) throw new Error("This profile is not registered on-chain yet.");
  return accounts[0].account.alias;
}
