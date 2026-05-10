import * as path from "path";
import * as os from "os";
import * as fs from "fs";

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
 * Returns the base .synapse directory
 */
export function getConfigDir(): string {
  const configDir = path.join(os.homedir(), ".synapse");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}
