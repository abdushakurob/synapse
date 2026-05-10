import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL } from "@synapse-io/sdk";
import * as fs from "fs";

const RPC_URL = "https://api.devnet.solana.com";

export async function whoami() {
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Scan for all dev-wallet*.json files in current directory
  const files = fs.readdirSync(process.cwd()).filter(f => f.startsWith("dev-wallet") && f.endsWith(".json"));
  
  if (files.length === 0) {
    console.log(`[CLI] No identity files found (dev-wallet*.json). Run 'synapse init' first.`);
    return;
  }

  console.log(`[CLI] DISCOVERED ${files.length} IDENTITIES\n`);

  for (const file of files) {
    try {
      const secret = JSON.parse(fs.readFileSync(file, "utf-8"));
      const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
      
      const provider = new AnchorProvider(connection, new Wallet(keypair), {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, provider as any);

      const bal = await connection.getBalance(keypair.publicKey);
      
      console.log(`--- [ ${file} ] ---`);
      console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
      console.log(`Balance:    ${bal / LAMPORTS_PER_SOL} SOL`);

      const allRegistries = await (program.account as any).agentRegistry.all();
      const myAliases = allRegistries.filter((a: any) => a.account.owner.equals(keypair.publicKey));

      if (myAliases.length > 0) {
        console.log(`Aliases:    ${myAliases.map((a: any) => (a.account as any).alias).join(", ")}`);
      } else {
        console.log(`Aliases:    None`);
      }
      console.log(""); // newline
    } catch (err: any) {
      console.error(`[CLI] Failed to read ${file}: ${err.message}`);
    }
  }
}
