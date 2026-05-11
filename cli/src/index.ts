#!/usr/bin/env node
import { Command } from "commander";
import * as pkg from "../package.json";
import { init } from "./init";
import { airdrop } from "./airdrop";
import { balance } from "./balance";
import { register } from "./register";
import { whoami } from "./whoami";
import { exportKey } from "./export-key";
import { profiles } from "./profiles";
import { setAccept } from "./set-accept";
import { publish } from "./publish";
import { transfer } from "./transfer";
import { printHeader } from "./cli-ui";
const { Select } = require("enquirer");
const program = new Command();

program
  .name("synapse")
  .description("Synapse decentralized communication protocol CLI")
  .version(pkg.version)
  .option("-p, --profile <name>", "The profile to use")
  .option("--json", "Output results in JSON format", false)
  .option("--debug", "Show full stack traces for errors", false);

// --- Sub-Menu Helpers ---

async function runAccountMenu() {
  const sub = new Select({
    name: "action",
    message: "Account Operations:",
    choices: [
      { name: "list", message: "List All Accounts" },
      { name: "create", message: "Create New Account" },
      { name: "show", message: "Show Details (whoami)" },
      { name: "export", message: "Export Secret Key" },
      { name: "back", message: "Back to Main Menu" }
    ],
    symbols: { prefix: '', pointer: '>', separator: ':' }
  });

  sub.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  const choice = await sub.run();
  if (choice === "back") return runInteractiveMenu();
  if (choice === "list") await profiles({});
  if (choice === "create") await init({});
  if (choice === "show") await whoami({});
  if (choice === "export") await exportKey({});
}

async function runWalletMenu() {
  const sub = new Select({
    name: "action",
    message: "Wallet Operations:",
    choices: [
      { name: "balance", message: "Check Balance" },
      { name: "airdrop", message: "Request Airdrop" },
      { name: "transfer", message: "Transfer SOL" },
      { name: "back", message: "Back to Main Menu" }
    ],
    symbols: { prefix: '', pointer: '>', separator: ':' }
  });

  sub.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  const choice = await sub.run();
  if (choice === "back") return runInteractiveMenu();
  if (choice === "balance") await balance({});
  if (choice === "airdrop") await airdrop({});
  if (choice === "transfer") await transfer({});
}

async function runRegistryMenu() {
  const sub = new Select({
    name: "action",
    message: "Registry Operations:",
    choices: [
      { name: "register", message: "Register Alias" },
      { name: "publish", message: "Publish Metadata" },
      { name: "allow", message: "Configure Firewall" },
      { name: "back", message: "Back to Main Menu" }
    ],
    symbols: { prefix: '', pointer: '>', separator: ':' }
  });

  sub.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  const choice = await sub.run();
  if (choice === "back") return runInteractiveMenu();
  if (choice === "register") await register(undefined, {});
  if (choice === "publish") await publish({});
  if (choice === "allow") await setAccept([], { open: false } as any);
}

async function runInteractiveMenu() {
  printHeader(pkg.version);
  const mainPrompt = new Select({
    name: "action",
    message: "What would you like to do?",
    choices: [
      { name: "account", message: "Manage Accounts (List, Create, Export)" },
      { name: "wallet", message: "Wallet Operations (Balance, Airdrop, Transfer)" },
      { name: "registry", message: "Registry Services (Register, Publish, Firewall)" },
      { name: "help", message: "View Command Help" },
      { name: "exit", message: "Exit" }
    ],
    symbols: { prefix: '', pointer: '>', separator: ':' }
  });

  mainPrompt.cancel = () => { process.stdout.write("\n"); process.exit(0); };
  try {
    const action = await mainPrompt.run();
    if (action === "exit") process.exit(0);
    if (action === "help") { program.help(); return; }
    if (action === "account") await runAccountMenu();
    if (action === "wallet") await runWalletMenu();
    if (action === "registry") await runRegistryMenu();
  } catch {
    process.exit(0);
  }
}

// Wrapper to catch errors and print them nicely
function wrap(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (err: any) {
      // Handle Enquirer cancellation (throws empty string or undefined)
      if (!err || err === "" || err.toString() === "Error" || err.toString().includes("cancel")) {
        process.exit(0);
      }

      if (program.opts().debug) {
        console.error(err);
      } else {
        console.error(`\n[Synapse Error] ${err.message || err}`);
        console.error(`Tip: Run with --debug to see full details.`);
      }
      process.exit(1);
    }
  };
}

// --- Namespaces ---
const account = program.command("account").description("Manage local identities");
account.command("create").description("Create a new agent profile").option("-p, --profile <name>", "Profile name").action(wrap(async (options) => { await init({ ...program.opts(), ...options } as any); }));
account.command("list").description("List all local profiles and balances").action(wrap(async () => { await profiles(program.opts() as any); }));
account.command("show").description("Show profile info and on-chain alias").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (options) => { await whoami({ ...program.opts(), ...options } as any); }));
account.command("export").description("Export secret key").option("-f, --file <path>", "Direct path to a wallet JSON file").option("--format <format>", "Output format: json | base58", "json").action(wrap(async (options) => { await exportKey({ ...program.opts(), ...options } as any); }));
account.action(async () => { if (process.argv.length === 3) await wrap(runAccountMenu)(); else account.help(); });

const wallet = program.command("wallet").description("Wallet operations (SOL)");
wallet.command("airdrop").description("Request devnet SOL airdrop").option("-a, --amount <sol>", "Amount of SOL to request").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (options) => { await airdrop({ ...program.opts(), ...options } as any); }));
wallet.command("balance").description("Check SOL balance").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (options) => { await balance({ ...program.opts(), ...options } as any); }));
wallet.command("transfer").description("Transfer SOL between wallets").option("-f, --from <path>", "Source wallet file or profile name").option("-t, --to <pubkey>", "Recipient public key or alias").option("-a, --amount <sol>", "Amount of SOL to transfer").action(wrap(async (options) => { await transfer({ ...program.opts(), ...options } as any); }));
wallet.action(async () => { if (process.argv.length === 3) await wrap(runWalletMenu)(); else wallet.help(); });

const registry = program.command("registry").description("On-chain discovery and registry");
registry.command("register").description("Register an agent alias on Solana").argument("[alias]", "The alias to register").option("-c, --category <name>", "Agent category", "general").option("--caps <list>", "Comma-separated capabilities", "").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (alias, options) => { const caps = options.caps ? options.caps.split(",") : []; await register(alias, { ...program.opts(), ...options, category: options.category, capabilities: caps } as any); }));
registry.command("publish").description("Publish agent metadata for discovery").option("-c, --category <name>", "New category").option("--caps <list>", "Comma-separated capabilities").action(wrap(async (options) => { const caps = options.caps ? options.caps.split(",") : undefined; await publish({ ...program.opts(), category: options.category, capabilities: caps } as any); }));
registry.command("allow").description("Update the agent's on-chain accept list").argument("[aliases...]", "Authorized agent aliases or pubkeys").option("--open", "Accept all connections", false).action(wrap(async (aliases, options) => { await setAccept(aliases || [], { ...program.opts(), open: options.open } as any); }));
registry.action(async () => { if (process.argv.length === 3) await wrap(runRegistryMenu)(); else registry.help(); });

// --- Flat Aliases ---
program.command("init").description("Alias for: synapse account create").option("-p, --profile <name>", "Profile name").action(wrap(async (options) => { await init({ ...program.opts(), ...options } as any); }));
program.command("profiles").description("Alias for: synapse account list").action(wrap(async () => { await profiles(program.opts() as any); }));
program.command("whoami").description("Alias for: synapse account show").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (options) => { await whoami({ ...program.opts(), ...options } as any); }));
program.command("airdrop").description("Alias for: synapse wallet airdrop").option("-a, --amount <sol>", "Amount of SOL to request").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (options) => { await airdrop({ ...program.opts(), ...options } as any); }));
program.command("balance").description("Alias for: synapse wallet balance").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (options) => { await balance({ ...program.opts(), ...options } as any); }));
program.command("transfer").description("Alias for: synapse wallet transfer").option("-f, --from <path>", "Source wallet file or profile name").option("-t, --to <pubkey>", "Recipient public key or alias").option("-a, --amount <sol>", "Amount of SOL to transfer").action(wrap(async (options) => { await transfer({ ...program.opts(), ...options } as any); }));
program.command("register").argument("[alias]", "The alias to register").description("Alias for: synapse registry register").option("-c, --category <name>", "Agent category", "general").option("--caps <list>", "Comma-separated capabilities", "").option("-f, --file <path>", "Direct path to a wallet JSON file").action(wrap(async (alias, options) => { const caps = options.caps ? options.caps.split(",") : []; await register(alias, { ...program.opts(), ...options, category: options.category, capabilities: caps } as any); }));

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) {
  wrap(runInteractiveMenu)().catch(() => process.exit(0));
} else {
  program.parse(process.argv);
}
