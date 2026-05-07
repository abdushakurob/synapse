import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Synapse } from "../target/types/synapse";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";

describe("synapse", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Synapse as Program<Synapse>;

  const initiator = Keypair.generate();
  const responder = Keypair.generate();
  const alias = "apex-capital";

  before(async () => {
    // Airdrop SOL to initiator and responder
    const sig1 = await provider.connection.requestAirdrop(initiator.publicKey, 1000000000);
    const sig2 = await provider.connection.requestAirdrop(responder.publicKey, 1000000000);
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig1,
    });
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig2,
    });
  });

  it("Registers an agent!", async () => {
    const [registryPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(alias)],
      program.programId
    );

    await program.methods
      .registerAgent(alias)
      .accounts({
        agentRegistry: registryPda,
        owner: initiator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initiator])
      .rpc();

    const registryAccount = await program.account.agentRegistry.fetch(registryPda);
    assert.equal(registryAccount.alias, alias);
    assert.ok(registryAccount.owner.equals(initiator.publicKey));
  });

  it("Creates a session!", async () => {
    const timestamp = new anchor.BN(Math.floor(Date.now() / 1000));
    const [sessionPda, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("session"),
        initiator.publicKey.toBuffer(),
        responder.publicKey.toBuffer(),
        timestamp.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const encryptedOffer = Buffer.from("dummy_encrypted_offer");

    await program.methods
      .createSession(timestamp, encryptedOffer)
      .accounts({
        session: sessionPda,
        initiator: initiator.publicKey,
        responder: responder.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initiator])
      .rpc();

    const sessionAccount = await program.account.session.fetch(sessionPda);
    assert.ok(sessionAccount.initiator.equals(initiator.publicKey));
    assert.ok(sessionAccount.responder.equals(responder.publicKey));
    assert.deepEqual(sessionAccount.encryptedOffer, encryptedOffer);
    assert.deepEqual(sessionAccount.status, { pending: {} });
  });

  // More tests would be added here for respond_session, close_session, expire_session
});
