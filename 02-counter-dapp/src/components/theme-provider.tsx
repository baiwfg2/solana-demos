'use client'
// theme switching requires browser APIs

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Customization: Easy to add custom logic or default props later
// Consistency: Centralizes theme provider usage across your app
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
