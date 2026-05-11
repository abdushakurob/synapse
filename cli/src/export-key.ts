import * as fs from "fs";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { resolveKeypair } from "./utils";
import { printKv, printNext } from "./cli-ui";
import { selectWallet } from "./cli-interactive";

export async function exportKey(options: { profile?: string, file?: string, format?: string }) {
  let identity;
  
  if (!options.profile && !options.file && process.stdin.isTTY) {
    const selected = await selectWallet("Select wallet to export");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    identity = { label: selected.label, walletPath: selected.path, keypair };
  } else {
    identity = resolveKeypair({ profile: options.profile, file: options.file });
  }

  const secretBytes = identity.keypair.secretKey;
  const format = (options.format || "json").toLowerCase();
  
  let value = "";
  if (format === "base58") {
    value = bs58.encode(secretBytes);
  } else if (format === "json") {
    value = JSON.stringify(Array.from(secretBytes));
  } else {
    throw new Error(`Unsupported --format '${options.format}'. Use 'json' or 'base58'.`);
  }

  printKv("Account Secret Exported", [
    ["Identity", identity.label],
    ["Public Key", identity.keypair.publicKey.toBase58()],
    ["Format", format],
    ["Value", value],
  ]);
  
  console.log("\nWARNING: Keep this secret key safe! Anyone with it can control your funds and identity.");
  printNext([
    `export SYNAPSE_SECRET_KEY='${value}'`,
  ]);
}
