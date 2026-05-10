import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import idl from "../../sdk/src/idl.json";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://api.devnet.solana.com";

export async function whoami() {
  const walletPath = path.resolve(__dirname, "../../dev-wallet.json");
  if (!fs.existsSync(walletPath)) {
    console.error(`[CLI] dev-wallet.json not found. Run 'synapse init' first.`);
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(keypair), {
    commitment: "confirmed",
  });
  const program = new Program(idl as any, provider as any);

  const bal = await connection.getBalance(keypair.publicKey);
  
  console.log(`[CLI] Public Key: ${keypair.publicKey.toBase58()}`);
  console.log(`[CLI] Balance: ${bal / LAMPORTS_PER_SOL} SOL`);

  try {
    const allRegistries = await (program.account as any).agentRegistry.all();
    const myAliases = allRegistries.filter((a: any) => a.account.owner.equals(keypair.publicKey));

    if (myAliases.length > 0) {
      console.log(`[CLI] Registered Aliases:`);
      myAliases.forEach((a: any) => console.log(`  - ${(a.account as any).alias}`));
    } else {
      console.log(`[CLI] Registered Aliases: None`);
    }
  } catch (err: any) {
    console.log(`[CLI] Registered Aliases: Error fetching from chain (${err.stack})`);
  }
}
