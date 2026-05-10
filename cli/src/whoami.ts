import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL } from "@synapse-io/sdk";
import * as fs from "fs";
import { getProfilePath } from "./utils";

const RPC_URL = "https://api.devnet.solana.com";

export async function whoami(options: { profile: string }) {
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

  const bal = await connection.getBalance(keypair.publicKey);
  
  console.log(`\n--- PROTOCOL IDENTITY [ ${profile} ] ---`);
  console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
  console.log(`Balance:    ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  // Find alias on-chain
  const accounts = await (program.account as any).agentRegistry.all([
    { memcmp: { offset: 8 + 4 + 32, bytes: keypair.publicKey.toBase58() } }
  ]);

  if (accounts.length > 0) {
    const acc = accounts[0].account;
    console.log(`Alias:      ${acc.alias}`);
    console.log(`Category:   ${acc.category || "none"}`);
    console.log(`Capabilities: ${acc.capabilities?.join(", ") || "none"}`);
    console.log(`Firewall:   ${acc.isOpen ? "OPEN" : "STRICT"}`);
    if (!acc.isOpen) {
      console.log(`Authorized: ${acc.acceptList.length} agent(s)`);
    }
  } else {
    console.log(`Status:     UNREGISTERED`);
  }
  console.log("");
}
