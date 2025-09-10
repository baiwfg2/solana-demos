'use client'

import { WalletButton } from '@/components/solana/solana-provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { IncrementButton, DecrementButton } from './pdacounter-ui'
import { CounterDisplay } from './CounterDisplay'

export default function PdaCounterFeature() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
          Solana Counter App
        </h1>
        <p className="text-gray-400 text-xl">
          A minimal dApp built with Anchor & Next.js
        </p>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm border border-gray-800">
        <div className="flex flex-col items-center space-y-8">
          <CounterDisplay />
          <div className="w-full space-y-4">
            <IncrementButton />
            <DecrementButton />            
          </div>
        </div>
      </Card>
    </div>
  )
}
