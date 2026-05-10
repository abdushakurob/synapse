#!/usr/bin/env node
import { Command } from "commander";
import { init } from "./init";
import { airdrop } from "./airdrop";
import { balance } from "./balance";
import { register } from "./register";
import { whoami } from "./whoami";
import { exportKey } from "./export-key";

const program = new Command();

program
  .name("synapse")
  .description("Synapse decentralized communication protocol CLI")
  .version("1.0.0");

program
  .command("init")
  .description("Create a new dev-wallet.json if one doesn't exist")
  .action(async () => {
    try {
      await init();
    } catch (err: any) {
      console.error(`[CLI] Init failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("airdrop")
  .description("Request devnet SOL airdrop to the dev-wallet")
  .action(async () => {
    try {
      await airdrop();
    } catch (err: any) {
      console.error(`[CLI] Airdrop failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("balance")
  .description("Check the Devnet SOL balance of the dev-wallet")
  .action(async () => {
    try {
      await balance();
    } catch (err: any) {
      console.error(`[CLI] Balance failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("register")
  .description("Register an agent alias on Solana")
  .argument("<alias>", "The alias to register")
  .action(async (alias) => {
    try {
      await register(alias);
      console.log(`[CLI] Successfully registered alias: ${alias}`);
    } catch (err: any) {
      console.error(`[CLI] Registration failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("whoami")
  .description("Print the current wallet pubkey, balance, and registered aliases")
  .action(async () => {
    try {
      await whoami();
    } catch (err: any) {
      console.error(`[CLI] whoami failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("export-key")
  .description("Export the secret key as a stringified array for Cloud/Vercel")
  .action(async () => {
    try {
      await exportKey();
    } catch (err: any) {
      console.error(`[CLI] Export failed: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
