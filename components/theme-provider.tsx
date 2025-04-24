"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type ThemeProviderProps = {
  children: React.ReactNode
} & Partial<{
  attribute: "class" | "data-theme" | "data-mode"
  defaultTheme: string
  enableSystem: boolean
  disableTransitionOnChange: boolean
}>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={props.attribute || "class"}
      defaultTheme={props.defaultTheme || "system"}
      enableSystem={props.enableSystem !== false}
      disableTransitionOnChange={props.disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  )
}
