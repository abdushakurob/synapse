import * as fs from "fs";
import * as path from "path";
import bs58 from "bs58";
import { getProfilePath, listProfiles } from "./utils";

/**
 * Exports the profile keypair as a Base58 string.
 * Guides the user if multiple profiles exist or the requested one is missing.
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
      const availableProfiles = listProfiles();
      const localWallets = fs.readdirSync(process.cwd())
        .filter(f => f.startsWith("dev-wallet") && f.endsWith(".json"));

      console.log(`\n[CLI] ERROR: Profile '${profile}' not found.`);
      
      if (availableProfiles.length > 0 || localWallets.length > 0) {
        console.log(`\nAvailable Projects/Profiles:`);
        if (availableProfiles.length > 0) {
          console.log(`  Managed Profiles (use --profile <name>):`);
          availableProfiles.forEach(p => console.log(`    - ${p}`));
        }
        if (localWallets.length > 0) {
          console.log(`  Local Wallets (use --file <path>):`);
          localWallets.forEach(w => console.log(`    - ${w}`));
        }
        console.log("");
        return;
      } else {
        throw new Error(`No profiles found. Run 'synapse init' to create one.`);
      }
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
