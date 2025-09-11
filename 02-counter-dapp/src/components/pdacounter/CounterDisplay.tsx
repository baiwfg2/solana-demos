import { Connection, PublicKey } from "@solana/web3.js";
import { useProgram } from "./pdacounter-data-access"
import { useState, useEffect, useCallback, useRef } from "react";

/*
------- 需要清理函数的情况：
WebSocket 连接
事件监听器
定时器 (setTimeout, setInterval)
订阅 (subscriptions)
手动创建的 DOM 元素

------ 不需要清理函数的情况：
普通的 HTTP 请求
一次性的计算操作
设置状态值
调用纯函数
*/
function setupAccountChangeListener(connection: Connection, program: any,
    counterAddr: PublicKey, setCounterVal: any) {
    if (!connection || !program) return () => {};
    
    try {
        // When the account at counterAddr changes, this callback will be invoked via WebSocket push mechanism
        const subId = connection.onAccountChange(
            counterAddr,
            (accountInfo: any) => {
                const decoded = program.coder.accounts.decode(
                    "pdaCounter", accountInfo.data);
                console.log("---- decoded pda counter value:", decoded);
                setCounterVal(Number(decoded.count));
            },
            {
                commitment: "confirmed",
                encoding: "base64",
            }
        );
        
        // 返回清理函数
        return () => {
            /*
            防止内存泄漏：WebSocket 连接如果不清理会一直占用内存
            避免重复监听：每次 effect 重新执行都会创建新的监听器
            防止回调混乱：旧的监听器可能还在监听已经无效的连接

            when dependants change, 移除旧监听器，创建新监听器
            */
            connection.removeAccountChangeListener(subId);
        };
    } catch (error) {
        console.log("setting up account change listener:", error);
        return () => {};
    }
}

export function CounterDisplay() {
    const { program, counterAddr, connected, connection } = useProgram();

    const [counterVal, setCounterVal] = useState<number | null>(null);
    const [isFetchingCounter, setIsFetchingCounter] = useState(true);
    // 作为"锁机制"，如果已经在获取中就直接返回
    const fetchingRef = useRef(false);

    const fetchCounterVal = useCallback(async () => {
        if (!connection || !program || fetchingRef.current) return;
        
        fetchingRef.current = true;
        try {
            setIsFetchingCounter(true);
            // console.log("=== Fetch Debug Info ===");
            // console.log("Program ID:", program.programId.toBase58());
            // console.log("Counter Address:", counterAddr.toBase58());
            // console.log("Connection endpoint:", connection.rpcEndpoint);
            
            // // 先检查账户是否存在
            // const accountInfo = await connection.getAccountInfo(counterAddr);
            // console.log("Account exists:", !!accountInfo);
            // console.log("Account owner:", accountInfo?.owner.toBase58());
            
            // 如果.pdaCounter写成了.counter，则报： Error: Invalid account discriminator
            // 前端自动将 rust 的PdaCounter 转换为 pdaCounter
            const counterData = await program.account.pdaCounter.fetch(counterAddr);
            setCounterVal(Number(counterData.count));
            console.log("Successfully fetched counter:", counterData.count);
        } catch (error) {
            console.log("fetching counter value:", error);
            setCounterVal(null);
        } finally {
            setIsFetchingCounter(false);
            fetchingRef.current = false;
        }
    }, [connection]);

    useEffect(() => {
        console.log("Connection changed, endpoint:", connection?.rpcEndpoint);
        if (connection) {
            fetchCounterVal();
        }
    }, [connection, fetchCounterVal]);

    // Set up WebSocket subscription to listen for account changes
    useEffect(() => {
        const cleanup = setupAccountChangeListener(
            connection, program, counterAddr, setCounterVal);
        return cleanup;
    }, [connection, counterAddr, program]);

    return (
        <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">Current Count:</p>
            <div className="text-4xl font-bold text-green-500">
                {isFetchingCounter ? (
                    <div>Loading...</div>
                ) : (
                    <p>{counterVal}</p>
                )}
            </div>
        </div>
    )
}