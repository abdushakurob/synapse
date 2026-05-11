import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import * as fs from "fs";
import { resolveKeypair } from "./utils";
import { printKv, devnetTxUrl } from "./cli-ui";
import { selectWallet, promptAmount, selectRecipient } from "./cli-interactive";

const RPC_URL = "https://api.devnet.solana.com";

export async function transfer(options: { from?: string, to?: string, amount?: string, file?: string, profile?: string }) {
  const source = options.file || options.from;
  let fromKeypair: Keypair;
  let label: string;

  if (!source && !options.profile) {
    const selected = await selectWallet("Select Sender Wallet");
    const secret = JSON.parse(fs.readFileSync(selected.path, "utf-8"));
    fromKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    label = selected.label;
  } else {
    const resolved = resolveKeypair({ profile: options.profile, file: source });
    fromKeypair = resolved.keypair;
    label = resolved.label;
  }

  let toInput = options.to;
  if (!toInput) {
    toInput = await selectRecipient("Select Recipient (or manual entry)");
  }
  if (!toInput) throw new Error("Recipient is required");

  let amountInput = options.amount;
  if (!amountInput) {
    amountInput = await promptAmount("Amount to transfer (SOL)");
  }
  if (!amountInput) throw new Error("Amount is required");

  const toPubkey = new PublicKey(toInput);
  const amount = parseFloat(amountInput) * LAMPORTS_PER_SOL;

  const connection = new Connection(RPC_URL, "confirmed");

  printKv("Initiating Transfer", [
    ["From", `${fromKeypair.publicKey.toBase58()} (${label})`],
    ["To", toPubkey.toBase58()],
    ["Amount", `${amountInput} SOL`],
  ]);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey,
      lamports: amount,
    })
  );

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    console.log(`\n[CLI] SUCCESS!`);
    console.log(`Explorer: ${devnetTxUrl(signature)}`);
    console.log(`---------------------------------------------------------`);
  } catch (err: any) {
    console.error(`\n[CLI] Transfer failed: ${err.message}`);
    throw err;
  }
}
