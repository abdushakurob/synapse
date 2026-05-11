import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { Registry, IDL } from "@synapse-io/sdk";
import { AnchorProvider, Wallet, Program } from "@coral-xyz/anchor";
import { parseOutputMode, printJson, printKv, printNext } from "./cli-ui";
import { selectWallet } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function whoami(options: { profile?: string; file?: string; json?: boolean }) {
  const output = parseOutputMode(options.json);
  
  let identity;
  if (!options.profile && !options.file && output === "text") {
    const selected = await selectWallet("Show info for");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    identity = { label: selected.label, walletPath: selected.path, keypair };
  } else {
    identity = resolveKeypair({ profile: options.profile, file: options.file });
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(identity.keypair), { commitment: "confirmed" });
  const program = new Program(IDL as any, provider);
  const registry = new Registry(program);

  let alias: string | null = null;
  try {
    const resolved = await registry.resolveAliasByPubkey(identity.keypair.publicKey);
    alias = resolved || null;
  } catch {
    alias = null;
  }

  if (output === "json") {
    printJson({
      ok: true,
      network: "devnet",
      identity: identity.label,
      publicKey: identity.keypair.publicKey.toBase58(),
      alias,
    });
    return;
  }

  const connectionBalance = new Connection("https://api.devnet.solana.com", "confirmed");
  let balance: number | null = null;
  try {
    const lamports = await connectionBalance.getBalance(identity.keypair.publicKey);
    balance = lamports / LAMPORTS_PER_SOL;
  } catch {
    balance = null;
  }

  printKv("Account Details", [
    ["Identity", identity.label],
    ["Public Key", identity.keypair.publicKey.toBase58()],
    ["Balance", balance !== null ? `${balance.toFixed(4)} SOL` : "unknown"],
    ["Alias", alias || "unregistered/unknown"],
  ]);
  
  if (!alias) {
    printNext([
      `synapse registry register my-alias --profile ${identity.label.split(":").pop()}`,
    ]);
  } else {
    printNext([
      `synapse wallet balance --profile ${identity.label.split(":").pop()}`,
      `synapse registry publish --profile ${identity.label.split(":").pop()}`,
    ]);
  }
}
