"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ToastContent } from "../ToastContent";

interface UseTransactionToastProps {
    txSig: string | null;
}

export function useTransactionToast({ txSig }: UseTransactionToastProps) {
    const toastRef = useRef<string | number | null>(null);

    useEffect(() => {
        if (txSig) {
            const explorerUrl = `https://solscan.io/tx/${txSig}?cluster=devnet`;
            // dismiss previous toast if exists
            if (toastRef.current) {
                toast.dismiss(toastRef.current);
            }

            toastRef.current = toast.success("Transaction sent", {
                description: (
                    <ToastContent
                        txSig={txSig}
                        explorerUrl={explorerUrl}
                    />
                ),
                style: {
                    backgroundColor: "#1f1f23",
                },
                duration: 5000,
            });
        }
    }, [txSig]);
}