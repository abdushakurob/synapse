import * as fs from "fs";
import bs58 from "bs58";
import { getProfilePath } from "./utils";

/**
 * Exports the profile keypair as a Base58 string.
 * This is used for easy copy-pasting into Environment Variables
 * (e.g., SYNAPSE_SECRET_KEY) for Cloud/Railway deployment.
 */
export async function exportKey(options: { profile: string, file?: string }) {
  let walletPath: string;
  let label: string;

  if (options.file) {
    walletPath = options.file;
    label = `FILE [ ${options.file} ]`;
  } else {
    const profile = options.profile || "default";
    walletPath = getProfilePath(profile);
    label = `PROFILE [ ${profile} ]`;

    if (!fs.existsSync(walletPath)) {
      throw new Error(`Profile '${profile}' not found. Run 'synapse init --profile ${profile}' first or use --file <path>.`);
    }
  }

  if (!fs.existsSync(walletPath)) {
    throw new Error(`File not found: ${walletPath}`);
  }

  try {
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    const base58Key = bs58.encode(Uint8Array.from(secret));
    
    console.log(`\n[CLI] EXPORTING ${label}`);
    console.log(`---------------------------------------------------------`);
    console.log(`Base58 Secret: ${base58Key}`);
    console.log(`---------------------------------------------------------`);
    console.log(`\nSet this as SYNAPSE_SECRET_KEY in your production environment.\n`);
  } catch (err: any) {
    console.error(`[CLI] Failed to export: ${err.message}`);
  }
}
