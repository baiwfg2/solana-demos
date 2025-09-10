import { useProgram } from "./pdacounter-data-access"
import { useState, useEffect, useCallback } from "react";

export function CounterDisplay() {
    const { program, counterAddr, connected, connection } = useProgram();

    const [counterVal, setCounterVal] = useState<number | null>(null);
    const [isFetchingCounter, setIsFetchingCounter] = useState(true);

    const fetchCounterVal = useCallback(async () => {
        if (!connection || !program) return;
        try {
            setIsFetchingCounter(true);
            console.log("Fetching counter value from:", counterAddr.toBase58());
            // 如果.pdaCounter写成了.counter，则报： Error: Invalid account discriminator
            // 前端自动将 rust 的PdaCounter 转换为 pdaCounter
            const counterData = await program.account.pdaCounter.fetch(counterAddr);
            setCounterVal(Number(counterData.count));
        } catch (error) {
            console.log("fetching counter value:", error);
            setCounterVal(null);
        } finally {
            setIsFetchingCounter(false);
        }
    }, [connection]);

    useEffect(() => {
        if (connection) {
            fetchCounterVal();
        }
    }, [connection, fetchCounterVal]);
    // TODO: if one set new value, how another one get updated immediately ?
    return (
        <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">Current Count:</p>
            <div className="text-4xl font-bold text-green-500">
                {isFetchingCounter ? (
                    <div />
                ) : (
                    <p>{counterVal}</p>
                )}
            </div>
        </div>
    )
}