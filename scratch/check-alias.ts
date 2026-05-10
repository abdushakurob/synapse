import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { SolanaRegistryAdapter } from "./sdk/src/registry";
import IDL from "./sdk/src/idl.json";

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    // Dummy wallet for reading
    const wallet = new Wallet(require("@solana/web3.js").Keypair.generate());
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new Program(IDL as any, provider);
    const registry = new SolanaRegistryAdapter(program);

    const aliases = ["apex-capital", "meridian-trading"];

    for (const alias of aliases) {
        try {
            const owner = await registry.resolve(alias);
            console.log(`[Registry] Alias: ${alias} -> Owner: ${owner.toBase58()}`);
        } catch (err) {
            console.log(`[Registry] Alias: ${alias} -> NOT FOUND`);
        }
    }
}

main();
