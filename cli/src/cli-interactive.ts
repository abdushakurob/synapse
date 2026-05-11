const { Select, Input, NumberPrompt } = require("enquirer");
import { listLocalProfileRecords, listLocalWalletFiles } from "./utils";

export async function selectWallet(message: string = "Select a wallet"): Promise<{ path: string, label: string }> {
  const profiles = listLocalProfileRecords();
  const localWallets = listLocalWalletFiles();

  const choices = [
    ...profiles.map(p => ({
      name: `profile:${p.name}`,
      message: `Profile: ${p.name.padEnd(20)} (${p.publicKey.slice(0, 8)}...)`,
      value: p.walletPath
    })),
    ...localWallets.map(w => {
      const name = w.split("/").pop() || "dev-wallet.json";
      return {
        name: `file:${name}`,
        message: `Local:   ${name.padEnd(20)}`,
        value: w
      };
    })
  ];

  if (choices.length === 0) {
    throw new Error("No wallets found. Create one first.");
  }

  const prompt = new Select({
    name: "wallet",
    message: message,
    choices: choices,
    result(val: string) {
      return choices.find(c => c.name === val);
    },
    symbols: { prefix: '', pointer: '>', separator: ':' }
  });

  prompt.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  const selected = await prompt.run();
  return { path: selected.value, label: selected.name };
}

export async function selectRecipient(message: string = "Select recipient"): Promise<string> {
  const profiles = listLocalProfileRecords();
  const localWallets = listLocalWalletFiles();

  const choices = [
    {
      name: "manual",
      message: "Enter public key or alias manually...",
      value: "manual"
    },
    ...profiles.map(p => ({
      name: p.publicKey,
      message: `Profile: ${p.name.padEnd(20)} (${p.publicKey.slice(0, 8)}...)`,
      value: p.publicKey
    })),
    ...localWallets.map(w => {
      const name = w.split("/").pop() || "dev-wallet.json";
      // We'd need to load the pubkey for the local wallet too
      return {
        name: `file:${name}`,
        message: `Local:   ${name.padEnd(20)}`,
        value: `file:${w}`
      };
    })
  ];

  const prompt = new Select({
    name: "recipient",
    message: message,
    choices: choices,
    symbols: { prefix: '', pointer: '>', separator: ':' }
  });

  prompt.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  const selected = await prompt.run();
  if (selected === "manual") {
    const inputPrompt = new Input({
      name: "manual_input",
      message: "Recipient Public Key or Alias",
      symbols: { prefix: '', separator: ':' }
    });
    inputPrompt.cancel = () => { process.stdout.write("\n"); process.exit(0); };
    return await inputPrompt.run();
  }
  
  if (selected.startsWith("file:")) {
    // We need to actually return the pubkey
    const path = selected.replace("file:", "");
    const { Keypair } = require("@solana/web3.js");
    const fs = require("fs");
    const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    return keypair.publicKey.toBase58();
  }

  return selected;
}

export async function promptAmount(message: string = "Enter amount (SOL)", initial: string = "0.1"): Promise<string> {
  const prompt = new Input({
    name: "amount",
    message: message,
    initial: initial,
    symbols: { prefix: '', separator: ':' }
  });
  prompt.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  return await prompt.run();
}

export async function promptInput(message: string, initial?: string): Promise<string> {
  const prompt = new Input({
    name: "input",
    message: message,
    initial: initial,
    symbols: { prefix: '', separator: ':' }
  });
  prompt.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  return await prompt.run();
}
