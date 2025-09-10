'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'
import { AppHeader } from '@/components/app-header'
import React from 'react'
import { AppFooter } from '@/components/app-footer'
import { ClusterChecker } from '@/components/cluster/cluster-ui'
import { AccountChecker } from '@/components/account/account-ui'

export function AppLayout({
  children,
  links,
}: {
  children: React.ReactNode
  links: { label: string; path: string }[]
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex flex-col min-h-screen">
        <AppHeader links={links} />
        <main className="flex-grow container mx-auto p-4">
          <ClusterChecker>
            <AccountChecker />
          </ClusterChecker>
          {children}
        </main>
        <AppFooter />
      </div>
      {/* 通常放在应用的根布局中，这样整个应用都能使用
      自动管理通知的显示、位置和消失
      支持不同类型的通知样式
      响应式设计，适配不同屏幕尺寸

      用于显示钱包连接状态、交易结果等通知
      */}
      <Toaster />
    </ThemeProvider>
  )
}
