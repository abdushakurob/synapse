import { Command } from "commander";
import { register } from "./register";

const program = new Command();

program
  .name("synapse")
  .description("Synapse decentralized communication protocol CLI")
  .version("1.0.0");

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

program.parse();
