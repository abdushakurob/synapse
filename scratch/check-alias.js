const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const { Program, AnchorProvider, Wallet } = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const wallet = new Wallet(Keypair.generate());
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    
    const idlPath = path.resolve(__dirname, "../sdk/src/idl.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const program = new Program(idl, provider);

    const aliases = ["apex-capital", "meridian-trading"];

    for (const alias of aliases) {
        try {
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from("agent"), Buffer.from(alias)],
                program.programId
            );
            const account = await program.account.agentRegistry.fetch(pda);
            console.log(`[Registry] Alias: ${alias} -> Owner: ${account.owner.toBase58()}`);
        } catch (err) {
            console.log(`[Registry] Alias: ${alias} -> NOT FOUND`);
        }
    }
}

main();
