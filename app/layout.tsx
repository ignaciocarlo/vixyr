import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "./ThemeProvider"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Vixyr — Image to Lyric Art",
  description:
    "Convert images into text art using song lyrics. Upload an image, pick a song, and watch your image transform into lyric-based ASCII art.",
  openGraph: {
    title: "Vixyr — Image to Lyric Art",
    description: "Turn images into text art using song lyrics.",
    type: "website",
    siteName: "Vixyr",
    url: "https://vixyr.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vixyr — Image to Lyric Art",
    description: "Convert images into text art using song lyrics.",
  },
  robots: { index: true, follow: true },
  applicationName: "Vixyr",
  keywords: ["ascii art", "lyric art", "image to text", "music art", "text art generator"],
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Vixyr",
      description: "Convert images into text art using song lyrics.",
      applicationCategory: "Multimedia",
      operatingSystem: "Web",
      url: "https://vixyr.app",
    }),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/dark-mode.js" />
        <ThemeProvider>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
