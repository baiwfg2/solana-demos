import { useState, MouseEvent } from "react";
import { Button } from "../ui/button";
import { Check, ClipboardCopy } from "lucide-react";

interface ToastContentProps {
    txSig: string;
    explorerUrl: string;
}

export function ToastContent({ txSig, explorerUrl }: ToastContentProps) {
    const [isContentCopied, setIsContentCopied] = useState(false);
    const handleContentCopy = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        navigator.clipboard.writeText(txSig);
        setIsContentCopied(true);
        setTimeout(() => setIsContentCopied(false), 2000);
    }

    return (
        <div className="mt-2">
            <div>
                {txSig}
            </div>
                <div>
                    <Button
                        onClick={handleContentCopy}
                    >
                        {isContentCopied ? (
                            <Check />
                        ) :(
                            <ClipboardCopy />
                        )}
                        {isContentCopied ? "Copied" : "Copy Signature"}
                    </Button>

                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(explorerUrl, "_blank");
                        }}
                    >
                        View on Explorer
                    </Button>
                </div>
        </div>
    );
}