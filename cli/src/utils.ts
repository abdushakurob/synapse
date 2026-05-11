import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { Keypair } from "@solana/web3.js";

/**
 * Centrally manages the persistent profile paths for the Synapse CLI.
 * Identities are stored in ~/.synapse/profiles/<name>.json
 */
export function getProfilePath(profileName: string = "default"): string {
  const profilesDir = path.join(os.homedir(), ".synapse", "profiles");
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  return path.join(profilesDir, `${profileName}.json`);
}

/**
 * Returns a list of all available profile names.
 */
export function listProfiles(): string[] {
  const profilesDir = path.join(os.homedir(), ".synapse", "profiles");
  if (!fs.existsSync(profilesDir)) return [];
  return fs.readdirSync(profilesDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));
}

export function getProjectRoot(): string {
  let curr = process.cwd();
  let bestRoot = curr;
  
  // Look up to 5 levels for the directory containing dev-wallet files
  for (let i = 0; i < 5; i++) {
    const files = fs.readdirSync(curr);
    
    // If we find wallets, this is definitely the root we want
    if (files.some(f => f.startsWith("dev-wallet") && f.endsWith(".json"))) {
      return curr;
    }

    // If we find repo markers, remember it as a potential root but keep looking for wallets
    if (files.includes("program") && files.includes("sdk")) {
      bestRoot = curr;
    }

    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  
  return bestRoot;
}

export function listLocalWalletFiles(): string[] {
  const root = getProjectRoot();
  try {
    return fs
      .readdirSync(root)
      .filter((f) => f.startsWith("dev-wallet") && f.endsWith(".json"))
      .map((f) => path.join(root, f));
  } catch {
    return [];
  }
}

export type LocalProfileRecord = {
  name: string;
  walletPath: string;
  publicKey: string;
};

export function listLocalProfileRecords(): LocalProfileRecord[] {
  const names = listProfiles();
  return names.map((name) => {
    const walletPath = getProfilePath(name);
    const keypair = loadKeypairFromFile(walletPath);
    return { name, walletPath, publicKey: keypair.publicKey.toBase58() };
  });
}

export function getConfigDir(): string {
  const configDir = path.join(os.homedir(), ".synapse");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}

export function loadKeypairFromFile(walletPath: string): Keypair {
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet file not found: ${walletPath}`);
  }
  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export function loadKeypairFromProfile(profileName: string): { walletPath: string; keypair: Keypair } {
  const walletPath = getProfilePath(profileName);
  const keypair = loadKeypairFromFile(walletPath);
  return { walletPath, keypair };
}

export function resolveKeypair(options: { profile?: string; file?: string }): {
  label: string;
  walletPath: string;
  keypair: Keypair;
} {
  if (options.file) {
    return {
      label: `file:${options.file}`,
      walletPath: options.file,
      keypair: loadKeypairFromFile(options.file),
    };
  }

  const requestedProfile = options.profile;
  const knownProfiles = listProfiles();
  const localWalletFiles = listLocalWalletFiles();

  // Explicit profile request: honor strictly.
  if (requestedProfile) {
    const walletPath = getProfilePath(requestedProfile);
    if (!fs.existsSync(walletPath)) {
      throw new Error(buildIdentityNotFoundMessage(requestedProfile, knownProfiles, localWalletFiles));
    }
    const keypair = loadKeypairFromFile(walletPath);
    return { label: `profile:${requestedProfile}`, walletPath, keypair };
  }

  // No explicit profile/file.
  const defaultPath = getProfilePath("default");
  if (fs.existsSync(defaultPath)) {
    const keypair = loadKeypairFromFile(defaultPath);
    return { label: "profile:default", walletPath: defaultPath, keypair };
  }

  if (knownProfiles.length === 1) {
    const only = knownProfiles[0];
    const walletPath = getProfilePath(only);
    const keypair = loadKeypairFromFile(walletPath);
    return { label: `profile:${only}`, walletPath, keypair };
  }

  if (knownProfiles.length === 0 && localWalletFiles.length === 1) {
    const only = localWalletFiles[0];
    const keypair = loadKeypairFromFile(only);
    return { label: `file:${only}`, walletPath: only, keypair };
  }

  throw new Error(buildIdentityNotFoundMessage("default", knownProfiles, localWalletFiles));
}

function buildIdentityNotFoundMessage(
  missingProfile: string,
  knownProfiles: string[],
  localWalletFiles: string[]
): string {
  const lines: string[] = [];
  lines.push(`Profile '${missingProfile}' not found at ${getProfilePath(missingProfile)}.`);
  if (knownProfiles.length > 0) {
    lines.push(`Available managed profiles: ${knownProfiles.join(", ")}`);
  }
  if (localWalletFiles.length > 0) {
    lines.push(`Detected local wallet files: ${localWalletFiles.join(", ")}`);
  }
  lines.push("Tip: pass --profile <name> or --file <path>, or create one with 'synapse account create --profile demosynapse-initiator'.");
  return lines.join("\n");
}
