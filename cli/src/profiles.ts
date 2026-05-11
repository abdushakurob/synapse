import * as fs from "fs";
import * as path from "path";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getConfigDir, loadKeypairFromFile, getProjectRoot, listLocalWalletFiles } from "./utils";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL } from "@synapse-io/sdk";
import { parseOutputMode, printJson, printNext } from "./cli-ui";

const RPC_URL = "https://api.devnet.solana.com";

export async function profiles(options: { json?: boolean } = {}) {
  const output = parseOutputMode(options.json);
  const profilesDir = path.join(getConfigDir(), "profiles");
  const localDir = getProjectRoot();

  const managedFiles = fs.existsSync(profilesDir) ? fs.readdirSync(profilesDir).filter(f => f.endsWith(".json")) : [];
  const localFiles = listLocalWalletFiles();


  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(Keypair.generate()), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);

  const rows: Array<{ type: string; name: string; publicKey: string; alias: string; balanceSol: number | null }> = [];

  // Process Managed Profiles
  for (const file of managedFiles) {
    const name = path.basename(file, ".json");
    const keypair = loadKeypairFromFile(path.join(profilesDir, file));
    const pubkey = keypair.publicKey.toBase58();
    const data = await fetchIdentityInfo(connection, program, keypair);
    rows.push({ type: "Managed", name, publicKey: pubkey, alias: data.alias, balanceSol: data.balanceSol });
  }

  // Process Local Wallets
  for (const file of localFiles) {
    const keypair = loadKeypairFromFile(path.join(localDir, file));
    const pubkey = keypair.publicKey.toBase58();
    const data = await fetchIdentityInfo(connection, program, keypair);
    rows.push({ type: "Local", name: file, publicKey: pubkey, alias: data.alias, balanceSol: data.balanceSol });
  }

  if (output === "json") {
    printJson({ ok: true, network: "devnet", accounts: rows });
    return;
  }

  const G = "\x1b[32m";
  const D = "\x1b[2m";
  const R = "\x1b[0m";

  process.stdout.write(`\n${G}Synapse Accounts${R}\n`);
  process.stdout.write(`${D}${"-".repeat(110)}${R}\n`);
  process.stdout.write(`${D}${"TYPE".padEnd(10)} ${"NAME".padEnd(20)} ${"ALIAS".padEnd(20)} ${"BALANCE".padEnd(12)} ${"PUBLIC KEY"}${R}\n`);
  process.stdout.write(`${D}${"-".repeat(110)}${R}\n`);

  for (const r of rows) {
    const bal = r.balanceSol === null ? "—" : `${r.balanceSol.toFixed(3)} SOL`;
    const aliasColor = r.alias === "unregistered" ? D : G;
    process.stdout.write(
      `${r.type.padEnd(10)} ` +
      `${r.name.padEnd(20)} ` +
      `${aliasColor}${r.alias.padEnd(20)}${R} ` +
      `${bal.padEnd(12)} ` +
      `${D}${r.publicKey}${R}\n`
    );
  }
  process.stdout.write(`${D}${"-".repeat(110)}${R}\n\n`);

  printNext([
    "synapse account create",
    "synapse wallet transfer",
    "synapse registry register",
  ]);
}

async function fetchIdentityInfo(connection: Connection, program: Program<any>, keypair: Keypair) {
  let alias = "unregistered";
  let balanceSol: number | null = null;
  try {
    const bal = await connection.getBalance(keypair.publicKey);
    balanceSol = bal / LAMPORTS_PER_SOL;
    const accounts = await (program.account as any).agentRegistry.all([
      { memcmp: { offset: 8 + 4 + 32, bytes: keypair.publicKey.toBase58() } }
    ]);
    if (accounts.length > 0) {
      alias = accounts[0].account.alias;
    }
  } catch {}
  return { alias, balanceSol };
}
