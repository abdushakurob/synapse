import { Keypair } from "@solana/web3.js";
import { readFileSync, writeFileSync } from "fs";

export function generateKeypair(): Keypair {
  return Keypair.generate();
}

export function saveKeypair(path: string, keypair: Keypair): void {
  writeFileSync(path, JSON.stringify(Array.from(keypair.secretKey)));
}

export function loadKeypair(path: string): Keypair {
  const raw = readFileSync(path, "utf8");
  const secret = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}
