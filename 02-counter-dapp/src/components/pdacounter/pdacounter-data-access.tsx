"use client";

import { Counter, CounterIDL } from "@project/anchor"
import * as anchor from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";

interface UseProgramReturn {
    program: anchor.Program<Counter>;
    counterAddr: PublicKey;
    walletAddr: PublicKey | null;
    connected: boolean;
    connection: anchor.web3.Connection;
}

export function useProgram(): UseProgramReturn {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const walletAddr = wallet?.publicKey || null;
    const connected = !!wallet;

    const program = useMemo(() => {
        if (wallet) {
            // create a provider with the wallet for tx signing
            const provider = new anchor.AnchorProvider(connection, wallet, {
                preflightCommitment: "confirmed",
            });
            return new anchor.Program<Counter>(CounterIDL, provider);
        } else {
            // create program with just connection for read-only operations
            return new anchor.Program<Counter>(CounterIDL, { connection });
        }
    }, [connection, wallet]);

    const counterAddr = useMemo(() => {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("pdacounter")],
            program.programId
        )[0];
    }, [program.programId]);

    useEffect(() => {
        const airdropFunc = async() => {
            if (!walletAddr) return;
            try {
                const balance = await connection.getBalance(walletAddr);
                const solBalance = balance / anchor.web3.LAMPORTS_PER_SOL;
                if (solBalance < 1) {
                    await connection.requestAirdrop(walletAddr, anchor.web3.LAMPORTS_PER_SOL);
                }
            } catch (error) {
                console.log("Airdrop error:", error);
            }
        };
        airdropFunc();
    }, [walletAddr]);

    return {
        program,
        counterAddr,
        walletAddr,
        connected,
        connection,
    };
}