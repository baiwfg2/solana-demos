import {
    PublicKey,
    Connection,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from "fs";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

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

export const sayHello = async (payer: Keypair): Promise<TransactionSignature> => {
    const tx = new Transaction();
    const inst = new TransactionInstruction({
        keys: [],
        programId: programId,
        data: Buffer.from([])
    });
    tx.add(inst);
    return sendAndConfirmTransaction(connection, tx, [payer]);
}

// try {
    const txSig = await sayHello(payer);
    console.log(`Tx: https://solscan.io/tx/${txSig}?cluster=custom&customUrl=http://127.0.0.1:8899`);
// } catch (err) {
//     if (err instanceof Error) {
//         console.error(`Err: ${err.message}`);
//     } else {
//         throw new Error("Unknown error");
//     }
// }