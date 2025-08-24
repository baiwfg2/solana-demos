import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import bs58 from 'bs58';

/**
 * Main function to send a transaction to the Solana program.
 */
async function main() {
  // --- 1. Setup the connection and keypairs ---

  // Connect to the Solana devnet cluster.
  const connection = new Connection('http://localhost:8899', 'confirmed');

  // Load the program's keypair from the file.
  // NOTE: Replace this with the path to your program's keypair file.
  const programKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync('./target/deploy/surfpool_solandy-keypair.json', 'utf8')
      )
    )
  );
  
  // The program's public key (the address on the chain).
  const programId = programKeypair.publicKey;
  console.log(`programId:${programId}`);

  /*
  // Generate a new keypair to pay for the transaction fees.
  // This account will be the "payer" in the transaction.
  const payer = Keypair.generate();
  // Airdrop some SOL to the payer account to cover the transaction fees.
  console.log(`Requesting airdrop for payer: ${payer.publicKey.toBase58()}...`);
  await connection.requestAirdrop(payer.publicKey, 1_000_000_000); // 1 SOL
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for a moment to ensure the airdrop is confirmed.
  */

  // Load the payer's keypair from the local Solana CLI configuration file.
  // This is typically located at ~/.config/solana/id.json
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8')))
  );
  console.log(`user key:${payer.publicKey.toBase58()}`);

  // --- 2. Create the instruction and transaction ---
  
  // accounts created by solandy. Let's see whether I can change it by CPI
  const counterProgram = new PublicKey("CntSpuietTr9CGAd7XDvXk4cpGb5PkCmNvSjajaCSNWJ");
  const counterStat = new PublicKey("CntrFE5Jf3cygAQ89zBjucTwSRwWQv6NvKS2JNFuHvZo");

  // The instruction to call your program.
  const instruction = new TransactionInstruction({
    keys: [
      {
        pubkey: counterProgram,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: counterStat,
        isSigner: false,
        isWritable: true,
      }
    ],
    programId: programId,
    data: Buffer.from([]), // The instruction data is empty for this program.
  });

  // Create a new transaction.
  const transaction = new Transaction().add(instruction);

  // --- 3. Send and confirm the transaction ---
  try {
    console.log('Sending transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer], // Sign with both the payer and the program keypair.
      { commitment: 'confirmed' }
    );
    
    console.log('Transaction confirmed!');
    console.log(`Transaction signature: ${signature}`);
  } catch (error) {
    console.error('Failed to send transaction:', error);
  }
}

main();
