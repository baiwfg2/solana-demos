'use client'

import { Button } from '@/components/ui/button'
import { useProgram } from './pdacounter-data-access'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTransactionToast } from './hooks/useTransactionToast'

export function IncrementButton() {
    const { program, walletAddr, connected } = useProgram();
    const [isOperating, setIsOperating] = useState(false);
    const [txSig, setTxSig] = useState<string | null>(null);

    useTransactionToast({ txSig });

    const handleIncrement = async () => {
        if (!walletAddr) return;
        try {
            setIsOperating(true);
            const txSig = await program.methods.incre()
                .accounts({
                    // 在anchor test中，payer 是通过anchor provider自动传入的，但前端中需手动传入
                    payer: walletAddr,
                })
                .rpc();
            setTxSig(txSig);
        } catch (error) {
           console.error("Error incrementing pda counter:", error);
           toast.error("Transaction failed", {
            description: `${error}`,
            style: {
                border: "1px solid #rgba(239, 68, 68, 0.3)",
            },
            duration: 5000,
           });
        } finally {
            setIsOperating(false);
        }
    };

    return (
        <Button
            onClick={handleIncrement}
            disabled={isOperating || !connected}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
            {isOperating ? (
                <div>
                    <div></div>
                    <span>Processing ...</span>
                </div>
            ) : (
                "Increment Counter"
            )}
        </Button>
    )
}

export function DecrementButton() {
    const { program, walletAddr, connected } = useProgram();
    return (
        <Button
            disabled={!connected}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
            Decrement Counter
        </Button>
    )
}