"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

interface ThemeContextValue {
  theme: "light" | "dark"
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    )
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("vixyr_theme", next)
      document.documentElement.classList.toggle("dark", next === "dark")
      return next
    })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("vixyr_theme")
      if (!stored || stored === "system") {
        document.documentElement.classList.toggle("dark", e.matches)
        setTheme(e.matches ? "dark" : "light")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
