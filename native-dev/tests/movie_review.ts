import {
    Connection,
    Keypair,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';

import { struct, u8, str } from '@coral-xyz/borsh';
import * as fs from 'fs';
import * as os from 'os';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

chai.use(chaiAsPromised);

/*
关键教训：

指令格式 ≠ 存储格式
指令格式用于传输数据给程序
存储格式是程序内部如何组织数据
读取时必须使用与存储格式匹配的 layout
这就是为什么在 Solana 开发中，需要分别定义：

- 指令的序列化格式（用于客户端到程序的通信）
- 账户状态的序列化格式（用于数据存储和读取）
*/
const ixLayout = struct([
    u8('variant'),
    // 必须得与 MovieReviewPayload 顺序一致
    str('title'),
    u8('rating'),
    str('description'),
]);

const movieReviewLayout = struct([
    u8('isInitialized'),
    u8('rating'),
    str('title'),
    str('description'),
]);

describe('movie review program', () => {
    let buffer: Buffer;

    const connection = new Connection('http://localhost:8899', 'confirmed');
    const programKeypair = Keypair.fromSecretKey(Uint8Array.from(
        JSON.parse(fs.readFileSync('./target/deploy/native_dev-keypair.json', 'utf8'))
    ));

    const programId = programKeypair.publicKey;

    const payer = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf8')))
    );

    beforeEach(() => {
        // set 1100 for case of 'description length 1001'
        buffer = Buffer.alloc(1100);
    });

    async function sendTx(variant: number, title: string, rating: number, description: string, pda: PublicKey) {
        ixLayout.encode(
            {
                variant: variant,
                title: title,
                rating: rating,
                description: description,
            },
            buffer
        );
        const encodedBuffer = buffer.subarray(0, ixLayout.getSpan(buffer));

        const tx = new Transaction();
        let inst: TransactionInstruction;
        if (variant === 0) {
            inst = new TransactionInstruction({
                programId: programId,
                data: encodedBuffer,
                keys: [
                    { pubkey: payer.publicKey, isSigner: true, isWritable: false },
                    { pubkey: pda, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
            });
        } else if (variant === 1) {
            inst = new TransactionInstruction({
                programId: programId,
                data: encodedBuffer,
                keys: [
                    { pubkey: payer.publicKey, isSigner: true, isWritable: false },
                    { pubkey: pda, isSigner: false, isWritable: true },
                ],
            });
        }
        tx.add(inst);
        return sendAndConfirmTransaction(connection, tx, [payer]);
    }

    it('add movie review', async () => {
        const title = `Add-${Math.floor(Math.random() * 10000)}`;
        const [pda] = PublicKey.findProgramAddressSync(
            [payer.publicKey.toBuffer(), Buffer.from(title)],
            programId
        );
        await sendTx(0, title, 5, "This is the first movie of Rambo series", pda);

        const accountInfo = await connection.getAccountInfo(pda);
        // layout must match the structure in rust
        const accountData = movieReviewLayout.decode(accountInfo.data);

        // Chai style assertions
        expect(accountData.isInitialized).to.equal(1);
        expect(accountData.rating).to.equal(5);
        expect(accountData.title).to.equal(title);
    });

    it("update movie review", async () => {
        // 每个测试创建自己的数据
        const title = `Update-${Math.floor(Math.random() * 10000)}`;
        const [pda] = PublicKey.findProgramAddressSync(
            [payer.publicKey.toBuffer(), Buffer.from(title)],
            programId
        );

        await sendTx(0, title, 5, "Original review", pda);
        await sendTx(1, title, 2, "Updated review", pda);

        const accountInfo = await connection.getAccountInfo(pda);
        const accountData = movieReviewLayout.decode(accountInfo.data);

        // Chai style assertions
        expect(accountData.isInitialized).to.equal(1);
        expect(accountData.rating).to.equal(2);
        expect(accountData.description).to.equal("Updated review");
    });

    it("update - rating value gt 5", async () => {
        const title = `Invalid-${Math.floor(Math.random() * 10000)}`;
        const [pda] = PublicKey.findProgramAddressSync(
            [payer.publicKey.toBuffer(), Buffer.from(title)],
            programId
        );

        await sendTx(0, title, 5, "Original review", pda);
        await expect(sendTx(1, title, 6, "Updated review", pda))
            .to.be.rejectedWith(/custom program error: 0x3/);

        const accountInfo = await connection.getAccountInfo(pda);
        const accountData = movieReviewLayout.decode(accountInfo.data);
        expect(accountData.description).to.equal("Original review");
    });

    it("update - rating value lt 1", async () => {
        const title = `Invalid-${Math.floor(Math.random() * 10000)}`;
        const [pda] = PublicKey.findProgramAddressSync(
            [payer.publicKey.toBuffer(), Buffer.from(title)],
            programId
        );

        await sendTx(0, title, 5, "Original review", pda);
        await expect(sendTx(1, title, 0, "Updated review", pda))
            .to.be.rejectedWith(/custom program error: 0x3/);

        const accountInfo = await connection.getAccountInfo(pda);
        const accountData = movieReviewLayout.decode(accountInfo.data);
        expect(accountData.description).to.equal("Original review");
    });

    it("update - description longer than 1000", async () => {
        const title = `Invalid-${Math.floor(Math.random() * 10000)}`;
        const [pda] = PublicKey.findProgramAddressSync(
            [payer.publicKey.toBuffer(), Buffer.from(title)],
            programId
        );

        await sendTx(0, title, 5, "Original review", pda);
        await expect(sendTx(1, title, 5, "Updated review".padEnd(1001, '.'), pda))
            .to.be.rejectedWith(/custom program error: 0x2/);

        const accountInfo = await connection.getAccountInfo(pda);
        const accountData = movieReviewLayout.decode(accountInfo.data);
        expect(accountData.description).to.equal("Original review");
    });

    it("update - update uninitialized account", async () => {
        // TODO
    });

    it('wrong payload layout cause invalid instruction data', async () => {
        // 使用较短的字符串避免 seed 长度限制
        const title = `WrongLayout-${Math.floor(Math.random() * 10000)}`;
        const [pda] = PublicKey.findProgramAddressSync(
            [payer.publicKey.toBuffer(), Buffer.from(title)],
            programId
        );

        const wrongOrderLayout = struct([
            u8('variant'),
            u8('rating'),      // ❌ rating 在前
            str('title'),      // ❌ title 在后
            str('description'),
        ]);

        wrongOrderLayout.encode(
            {
                variant: 0,
                rating: 5,
                title: title,
                description: "This should fail",
            },
            buffer
        );
        buffer = buffer.subarray(0, wrongOrderLayout.getSpan(buffer));

        const tx = new Transaction();
        const inst = new TransactionInstruction({
            programId: programId,
            data: buffer,
            keys: [
                { pubkey: payer.publicKey, isSigner: true, isWritable: false },
                { pubkey: pda, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
        });
        tx.add(inst);

        await expect(sendAndConfirmTransaction(connection, tx, [payer]))
            .to.be.rejectedWith(/invalid instruction data/);
    });
});