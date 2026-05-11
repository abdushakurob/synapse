import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Ensures a wallet has sufficient SOL for agent operations.
 * Defaults to maintaining 0.05 SOL.
 */
export async function maintainLiquidity(
  connection: Connection,
  keypair: Keypair,
  threshold: number = 0.05,
  topUpAmount: number = 1.0
): Promise<boolean> {
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    const thresholdLamports = threshold * LAMPORTS_PER_SOL;

    if (balance < thresholdLamports) {
      console.log(`[Liquidity] Balance low (${balance / LAMPORTS_PER_SOL} SOL). Requesting top-up...`);
      
      // On devnet, we use airdrop. In production, this would trigger a transfer from a vault.
      const signature = await connection.requestAirdrop(keypair.publicKey, topUpAmount * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      
      console.log(`[Liquidity] Top-up successful: ${signature}`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[Liquidity] Top-up failed: ${err.message}`);
  }
  return false;
}

/**
 * Starts a background loop to maintain liquidity.
 */
export function startLiquidityService(
  connection: Connection,
  keypair: Keypair,
  intervalMs: number = 60000
) {
  const run = async () => {
    await maintainLiquidity(connection, keypair);
    setTimeout(run, intervalMs);
  };
  run();
}
