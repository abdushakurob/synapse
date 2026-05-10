import { Keypair } from "@solana/web3.js";
export declare function generateKeypair(): Keypair;
export declare function saveKeypair(path: string, keypair: Keypair): void;
export declare function loadKeypair(path: string): Keypair;
