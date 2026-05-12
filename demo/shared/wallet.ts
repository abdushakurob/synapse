import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

/**
 * Loads a wallet from the current directory or package directory.
 * If not found, generates a new one and requests an airdrop on devnet.
 */
export async function loadOrCreateWallet(name: string): Promise<Keypair> {
  const filename = `${name}.json`;
  
  // 1. Try to find the wallet in the Current Working Directory (user's project)
  let walletPath = path.resolve(process.cwd(), filename);
  
  // 2. If not in CWD, check if we have a pre-funded default in the package
  if (!fs.existsSync(walletPath)) {
    // Note: in dist/shared/wallet.js, we go up twice to reach the package root
    const pkgPath = path.resolve(__dirname, "../../", filename);
    if (fs.existsSync(pkgPath)) {
      console.log(`[Synapse] Inheriting pre-funded identity from package: ${filename}`);
      try {
        fs.copyFileSync(pkgPath, walletPath);
      } catch (err) {
        // If CWD is read-only, we'll just use the pkgPath directly for this session
        walletPath = pkgPath;
      }
    }
  }

  let keypair: Keypair;

  if (fs.existsSync(walletPath)) {
    console.log(`[Synapse] Loading identity: ${name} (from local disk)`);
    try {
      keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8"))));
    } catch (err) {
      console.log(`[Synapse] Failed to parse ${name}.json. Generating fresh identity...`);
      keypair = Keypair.generate();
      fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)));
    }
  } else {
    console.log(`[Synapse] Generating fresh identity for ${name}...`);
    keypair = Keypair.generate();
    fs.writeFileSync(walletPath, JSON.stringify(Array.from(keypair.secretKey)));
    console.log(`[Synapse] Identity saved to: ${walletPath}`);
  }

  // 3. Ensure the wallet has "Fuel" (SOL) for on-chain handshakes
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    
    if (balance < 0.05 * LAMPORTS_PER_SOL) {
      console.log(`[Solana] Identity ${keypair.publicKey.toBase58().substring(0, 8)} needs fuel. Requesting airdrop...`);
      const sig = await connection.requestAirdrop(keypair.publicKey, 1 * LAMPORTS_PER_SOL);
      
      // Wait for confirmation to avoid "Insufficient Funds" during immediate registration
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        ...latestBlockhash
      });
      console.log(`[Solana] Fuel delivered: +1.0 SOL [OK]`);
    }
  } catch (err: any) {
    console.warn(`[Solana] Airdrop skipped: ${err.message}. If the demo fails, manually run: synapse airdrop`);
  }

  return keypair;
}
