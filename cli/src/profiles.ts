import * as fs from "fs";
import * as path from "path";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getProfilePath, getConfigDir } from "./utils";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../../sdk/src/idl.json";

const RPC_URL = "https://api.devnet.solana.com";

export async function profiles() {
  const profilesDir = path.join(getConfigDir(), "profiles");
  if (!fs.existsSync(profilesDir)) {
    console.log("[CLI] No profiles found.");
    return;
  }

  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith(".json"));
  console.log(`\n[CLI] Found ${files.length} profiles:\n`);
  console.log("NAME".padEnd(20), "PUBLIC KEY".padEnd(46), "ALIAS".padEnd(20), "BALANCE");
  console.log("-".repeat(100));

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(Keypair.generate()), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);

  for (const file of files) {
    const name = path.basename(file, ".json");
    const secret = JSON.parse(fs.readFileSync(path.join(profilesDir, file), "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    const pubkey = keypair.publicKey.toBase58();
    
    let alias = "unregistered";
    let balance = "0.000";

    try {
      const bal = await connection.getBalance(keypair.publicKey);
      balance = (bal / LAMPORTS_PER_SOL).toFixed(3);
      
      // Try to find alias on-chain
      const accounts = await (program.account as any).agentRegistry.all([
        { memcmp: { offset: 8 + 4 + 32, bytes: pubkey } }
      ]);
      if (accounts.length > 0) {
        alias = accounts[0].account.alias;
      }
    } catch (err) {
      // Ignore network errors for specific profile
    }

    console.log(
      name.padEnd(20),
      pubkey.padEnd(46),
      alias.padEnd(20),
      `${balance} SOL`
    );
  }
  console.log();
}
