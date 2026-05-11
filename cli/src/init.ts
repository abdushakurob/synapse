import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import { getProfilePath } from "./utils";
import { printKv, printNext } from "./cli-ui";
import { promptInput } from "./cli-interactive";

export async function init(options: { profile?: string }) {
  let profile = options.profile;
  
  if (!profile && process.stdin.isTTY) {
    profile = await promptInput("Enter a name for your new profile", "default");
  }
  
  profile = profile || "default";
  const walletPath = getProfilePath(profile);
  
  if (fs.existsSync(walletPath)) {
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    printKv("Account profile already exists", [
      ["Profile", profile],
      ["Public Key", keypair.publicKey.toBase58()],
      ["Path", walletPath],
    ]);
    printNext([
      `synapse wallet airdrop --profile ${profile} --amount 2`,
      `synapse account show --profile ${profile}`,
    ]);
    return;
  }
  
  const keypair = Keypair.generate();
  fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)));
  printKv("Account profile created", [
    ["Profile", profile],
    ["Public Key", keypair.publicKey.toBase58()],
    ["Path", walletPath],
  ]);
  printNext([
    `synapse wallet airdrop --profile ${profile} --amount 2`,
    `synapse account show --profile ${profile}`,
  ]);
}
