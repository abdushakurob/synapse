#!/usr/bin/env node
import { Command } from "commander";
import { init } from "./init";
import { airdrop } from "./airdrop";
import { balance } from "./balance";
import { register } from "./register";
import { whoami } from "./whoami";
import { exportKey } from "./export-key";
import { profiles } from "./profiles";
import { setAccept } from "./set-accept";
import { publish } from "./publish";

const program = new Command();

program
  .name("synapse")
  .description("Synapse decentralized communication protocol CLI")
  .version("1.0.0")
  .option("-p, --profile <name>", "The profile to use", "default");

program
  .command("init")
  .description("Create a new agent profile")
  .action(async () => {
    try {
      await init(program.opts() as any);
    } catch (err: any) {
      console.error(`[CLI] Init failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("airdrop")
  .description("Request devnet SOL airdrop")
  .option("-a, --amount <sol>", "Amount of SOL to request", "2")
  .action(async (options) => {
    try {
      await airdrop({ ...program.opts(), ...options } as any);
    } catch (err: any) {
      console.error(`[CLI] Airdrop failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("balance")
  .description("Check SOL balance")
  .action(async () => {
    try {
      await balance(program.opts() as any);
    } catch (err: any) {
      console.error(`[CLI] Balance failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("register")
  .description("Register an agent alias on Solana")
  .argument("<alias>", "The alias to register")
  .option("-c, --category <name>", "Agent category", "general")
  .option("--caps <list>", "Comma-separated capabilities", "")
  .action(async (alias, options) => {
    try {
      const caps = options.caps ? options.caps.split(",") : [];
      await register(alias, { ...program.opts(), category: options.category, capabilities: caps } as any);
      console.log(`[CLI] Successfully registered alias: ${alias}`);
    } catch (err: any) {
      console.error(`[CLI] Registration failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("whoami")
  .description("Show profile info")
  .action(async () => {
    try {
      await whoami(program.opts() as any);
    } catch (err: any) {
      console.error(`[CLI] whoami failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("export-key")
  .description("Export Base58 secret key for cloud deployment")
  .option("-f, --file <path>", "Direct path to a wallet JSON file")
  .action(async (options) => {
    try {
      await exportKey({ ...program.opts(), ...options } as any);
    } catch (err: any) {
      console.error(`[CLI] Export failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("profiles")
  .description("List all local profiles")
  .action(async () => {
    try {
      await profiles();
    } catch (err: any) {
      console.error(`[CLI] profiles failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("set-accept")
  .description("Update the agent's on-chain accept list")
  .argument("<aliases...>", "Authorized agent aliases or pubkeys")
  .option("--open", "Accept all connections", false)
  .action(async (aliases, options) => {
    try {
      await setAccept(aliases, { ...program.opts(), open: options.open } as any);
    } catch (err: any) {
      console.error(`[CLI] set-accept failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("publish")
  .description("Publish agent metadata for discovery")
  .option("-c, --category <name>", "New category")
  .option("--caps <list>", "Comma-separated capabilities")
  .action(async (options) => {
    try {
      const caps = options.caps ? options.caps.split(",") : undefined;
      await publish({ ...program.opts(), category: options.category, capabilities: caps } as any);
    } catch (err: any) {
      console.error(`[CLI] publish failed: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
