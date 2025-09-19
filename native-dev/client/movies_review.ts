import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { struct, u8, str } from "@coral-xyz/borsh";
import { writeFileSync } from "fs";
import * as fs from "fs";
import os from "os";
import dotenv from "dotenv";

const movieInstructionLayout = struct([
    u8("variant"),
    str("title"),
    u8("rating"),
    str("description"),
]);

async function sendMovieReview(connection: Connection, signer: Keypair, programId: PublicKey) {
    let buffer = Buffer.alloc(1000);
    const movieTitle = `TheFirstBlood-${Math.random() * 100000}`;
    movieInstructionLayout.encode(
        {
            variant: 0,
            title: movieTitle,
            rating: 5,
            description: "This is the first movie of Rambo series",
        },
        buffer
    );
    buffer = buffer.subarray(0, movieInstructionLayout.getSpan(buffer));
    const [pda] = await PublicKey.findProgramAddressSync(
        [signer.publicKey.toBuffer(), Buffer.from(movieTitle)],
        programId
    );
    console.log(`PDA: ${pda.toBase58()}`);
    const tx = new Transaction();
    const inst = new TransactionInstruction({
        programId: programId,
        data: buffer,
        keys: [
            { pubkey: signer.publicKey, isSigner: true, isWritable: false },
            { pubkey: pda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
    });
    tx.add(inst);
    const txSig = await sendAndConfirmTransaction(connection, tx, [signer]);
    console.log(`Tx: https://solscan.io/tx/${txSig}?cluster=custom&customUrl=http://127.0.0.1:8899`);
}

async function main() {
    const connection = new Connection('http://localhost:8899', 'confirmed');
    const programKeypair = Keypair.fromSecretKey(Uint8Array.from(
        JSON.parse(fs.readFileSync('./target/deploy/native_dev-keypair.json', 'utf8'))
    ));
    
    const programId = programKeypair.publicKey;
    console.log(`programId:${programId}`);
    
    const payer = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8')))
    );
    console.log(`user key:${payer.publicKey.toBase58()}`);
    await sendMovieReview(connection, payer, programId);
}

main();