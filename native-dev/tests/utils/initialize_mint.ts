import { airdropIfRequired, getExplorerLink, initializeKeypair } from "@solana-developers/helpers";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction, TransactionInstruction
} from "@solana/web3.js";

export async function initializeMint(url: string, programId: PublicKey) {
    const conn = new Connection(url, 'confirmed');
    const userKeyPair = await initializeKeypair(conn);
    await airdropIfRequired(conn, userKeyPair.publicKey, 2 * LAMPORTS_PER_SOL, 1 * LAMPORTS_PER_SOL);

    const [tokenMintPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("token_mint")],
        programId
    );
    const [tokenAuthPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("token_auth")],
        programId
    );

    const initMintInst = new TransactionInstruction({
        keys: [
            { pubkey: userKeyPair.publicKey, isSigner: true, isWritable: true },
            { pubkey: tokenMintPda, isSigner: false, isWritable: true },
            { pubkey: tokenAuthPda, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: programId,
        data: Buffer.from(Uint8Array.of(3))
    });

    const tx = new Transaction().add(initMintInst);
    try {
        const txSig = await sendAndConfirmTransaction(conn, tx, [userKeyPair]);
        const explorerLink = getExplorerLink("transaction", txSig);
        console.log(`tx sig: ${explorerLink}`);
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`Failed to initialize mint: ${err.message}`);
        } else {
            throw new Error("Unknown error");
        }
    }
}

async function main() {
    await initializeMint('http://localhost:8899',
        new PublicKey("BEHT4gUWZUU3ks5YppNDFrkHSh8UnaCMML5YW9192Kj8"));
}

main().catch((err) => {
    if (err instanceof Error) {
        console.error(err.message);
    } else {
        throw new Error("Unknown error");
    }
});