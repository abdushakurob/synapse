import bs58 from "bs58";

export type OutputMode = "text" | "json";

export function parseOutputMode(value: unknown): OutputMode {
  return value === true || value === "json" ? "json" : "text";
}

export function printJson(obj: unknown): void {
  process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`);
}

export function printHeader(version: string): void {
  const G = "\x1b[32m";
  const D = "\x1b[2m";
  const R = "\x1b[0m";
  
  process.stdout.write(`\n${G}Synapse${R}\n`);
  process.stdout.write(`The future of agentic comms\n\n`);
  process.stdout.write(`${D}v${version}${R}\n`);
  process.stdout.write(`${D}${"-".repeat(50)}${R}\n`);
}

export function printKv(title: string, rows: Array<[string, string]>): void {
  process.stdout.write(`\n[Synapse] ${title}\n`);
  process.stdout.write(`${"-".repeat(72)}\n`);
  for (const [k, v] of rows) {
    process.stdout.write(`${k.padEnd(16)} ${v}\n`);
  }
  process.stdout.write(`${"-".repeat(72)}\n`);
}

export function printList(title: string, lines: string[]): void {
  process.stdout.write(`\n[Synapse] ${title}\n`);
  process.stdout.write(`${"-".repeat(72)}\n`);
  for (const line of lines) {
    process.stdout.write(`- ${line}\n`);
  }
  process.stdout.write(`${"-".repeat(72)}\n`);
}

export function printNext(steps: string[]): void {
  if (steps.length === 0) return;
  process.stdout.write(`\nNext steps:\n`);
  for (const s of steps) {
    process.stdout.write(`  $ ${s}\n`);
  }
}

export function devnetTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function shortKey(pubkey: string, chars = 4): string {
  if (pubkey.length <= chars * 2 + 3) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

export function toBase58Secret(secretBytes: Uint8Array): string {
  return bs58.encode(secretBytes);
}

