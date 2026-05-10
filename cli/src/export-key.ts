import * as fs from "fs";
import bs58 from "bs58";
import { getProfilePath } from "./utils";

/**
 * Exports the profile keypair as a Base58 string.
 * This is used for easy copy-pasting into Environment Variables
 * (e.g., SYNAPSE_SECRET_KEY) for Cloud/Railway deployment.
 */
export async function exportKey(options: { profile: string }) {
  const profile = options.profile || "default";
  const walletPath = getProfilePath(profile);

  if (!fs.existsSync(walletPath)) {
    throw new Error(`Profile '${profile}' not found. Run 'synapse init --profile ${profile}' first.`);
  }

  try {
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    const base58Key = bs58.encode(Uint8Array.from(secret));
    
    console.log(`\n[CLI] EXPORTING PROFILE [ ${profile} ]`);
    console.log(`---------------------------------------------------------`);
    console.log(`Base58 Secret: ${base58Key}`);
    console.log(`---------------------------------------------------------`);
    console.log(`\nSet this as SYNAPSE_SECRET_KEY in your production environment.\n`);
  } catch (err: any) {
    console.error(`[CLI] Failed to export ${profile}: ${err.message}`);
  }
}
