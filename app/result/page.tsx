"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "../ThemeProvider"
import { buildDensityMap } from "../lib/densityMap"
import { processImage, processImageWithWords } from "../lib/imageProcessor"
import type { ProcessedImage, ViewMode, ArtMode } from "../types"

export default function ResultPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [lyrics, setLyrics] = useState("")
  const [artist, setArtist] = useState("")
  const [songTitle, setSongTitle] = useState("")
  const [musicSource, setMusicSource] = useState<{
    type: string; url?: string; dataUrl?: string
  } | null>(null)
  const [width, setWidth] = useState(100)
  const [invert, setInvert] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const [artMode, setArtMode] = useState<ArtMode>("word")
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  const [dynFontSize, setDynFontSize] = useState(6)
  const [showControls, setShowControls] = useState(true)
  const [fontColor, setFontColor] = useState<string | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const textColor = fontColor || (theme === "dark" ? "#fff" : "#000")

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return

    const img = sessionStorage.getItem("vixyr_image")
    const lyr = sessionStorage.getItem("vixyr_lyrics")
    const music = sessionStorage.getItem("vixyr_music")

    if (!img || !lyr) {
      router.push("/")
      return
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    setLyrics(lyr)
    setArtist(sessionStorage.getItem("vixyr_artist") || "")
    setSongTitle(sessionStorage.getItem("vixyr_title") || "")
    if (music) {
      try { setMusicSource(JSON.parse(music)) } catch { /* ignore */ }
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setError("Failed to process image")
        return
      }
      ctx.drawImage(image, 0, 0)
      setImageData(ctx.getImageData(0, 0, image.width, image.height))
      setReady(true)
    }
    image.onerror = () => setError("Failed to load image")
    image.src = img
  }, [router])

  useEffect(() => {
    if (artist || songTitle) {
      document.title = `${songTitle || "Lyric Art"}${artist ? ` — ${artist}` : ""} | Vixyr`
    }
  }, [artist, songTitle])

  const processed: ProcessedImage | null = useMemo(() => {
    if (!imageData || !lyrics) return null
    try {
      if (artMode === "word") {
        return processImageWithWords(imageData, width, lyrics, invert)
      }
      const density = buildDensityMap(invert ? reverseString(lyrics) : lyrics)
      return processImage(imageData, width, density)
    } catch {
      return null
    }
  }, [imageData, lyrics, width, invert, artMode])

  const textContent = useMemo(() => {
    if (!processed) return ""
    return processed.charGrid.map((row) => row.join("")).join("\n")
  }, [processed])

  useEffect(() => {
    if (!processed || viewMode !== "html") return
    const el = containerRef.current
    if (!el) return

    const obs = new ResizeObserver(([entry]) => {
      const { width: aw, height: ah } = entry.contentRect
      if (aw <= 0 || ah <= 0 || processed.width === 0 || processed.height === 0) return

      const byW = aw / (processed.width * 0.55)
      const byH = ah / (processed.height * 1.1)
      setDynFontSize(Math.max(2, Math.min(byW, byH) * 0.8))
    })

    obs.observe(el)
    return () => obs.disconnect()
  }, [processed, viewMode])

  useEffect(() => {
    if (!ready || processed) return
    const timer = setTimeout(() => {
      setError("Processing timed out. Try switching to Char mode or adjusting the width.")
    }, 5000)
    return () => clearTimeout(timer)
  }, [ready, processed])

  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [textContent])

  const handleDownload = useCallback(() => {
    const blob = new Blob([textContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "lyric-art.txt"
    a.click()
    URL.revokeObjectURL(url)
  }, [textContent])

  const handleSaveImage = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(el, { backgroundColor: theme === "dark" ? "#000" : "#fff" })
      const link = document.createElement("a")
      link.download = `${songTitle || "lyric-art"}.png`
      link.href = dataUrl
      link.click()
    } catch { /* ignore */ }
  }, [theme, songTitle])

  const youtubeId = musicSource?.type === "youtube"
    ? extractYoutubeId(musicSource.url || "")
    : null

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!ready || !processed) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent dark:border-zinc-50" />
      </div>
    )
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">
      <div className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          ← Back
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </Button>
      </div>

      <div
        ref={containerRef}
        className="flex flex-1 flex-col items-center justify-center overflow-hidden px-2"
      >
        {viewMode === "html" ? (
          <>
            {(artist || songTitle) && (
              <div className="text-center mb-2" style={{ fontSize: `${Math.max(6, dynFontSize * 1.2)}px` }}>
                <div
                  className="font-bold leading-tight"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    color: textColor,
                    fontSize: `${Math.max(8, dynFontSize * 1.4)}px`,
                  }}
                >
                  {songTitle || "Untitled"}
                </div>
                {artist && (
                  <div
                    className="opacity-60 leading-tight"
                    style={{
                      fontFamily: "'Courier New', monospace",
                      color: textColor,
                      fontSize: `${Math.max(6, dynFontSize * 1)}px`,
                    }}
                  >
                    {artist}
                  </div>
                )}
              </div>
            )}
            <pre
              className="select-none leading-[1.1] whitespace-pre-wrap break-all text-center"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: `${dynFontSize}px`,
                letterSpacing: 0,
                color: textColor,
                wordBreak: "break-all",
              }}
            >
              {textContent}
            </pre>
          </>
        ) : (
          <pre
            className="select-all whitespace-pre text-xs leading-5"
            style={{
              fontFamily: "'Courier New', monospace",
              color: textColor,
            }}
          >
            {artist && songTitle ? `${songTitle}\n${artist}\n\n` : ""}{textContent}
          </pre>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 flex flex-col items-center">
        {showControls && (
          <div className="w-full border-t border-zinc-200/50 bg-white/80 backdrop-blur-md dark:border-zinc-800/50 dark:bg-black/80">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Width</span>
                <Slider value={[width]} onValueChange={([v]) => setWidth(v)} min={40} max={200} className="w-20" />
                <span className="text-zinc-400 min-w-5">{width}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Invert</span>
                <Switch checked={invert} onCheckedChange={setInvert} />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Mode</span>
                <div className="flex rounded-md border border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setArtMode("word")}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      artMode === "word"
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Word
                  </button>
                  <button
                    onClick={() => setArtMode("char")}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      artMode === "char"
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Char
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">View</span>
                <div className="flex rounded-md border border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setViewMode("html")}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      viewMode === "html"
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setViewMode("text")}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      viewMode === "text"
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Text
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={handleDownload}>
                  .txt
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={handleSaveImage}>
                  PNG
                </Button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={fontColor || "#ffffff"}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="hidden"
                />
                <button
                  onClick={() => colorInputRef.current?.click()}
                  className="h-6 w-6 rounded border border-zinc-300 dark:border-zinc-700"
                  style={{ backgroundColor: textColor }}
                  title="Font color"
                  aria-label="Font color"
                />
                {fontColor && (
                  <button
                    onClick={() => setFontColor(null)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    title="Reset color"
                  >
                    ✕
                  </button>
                )}
              </div>

              {artist && songTitle && (
                <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500 truncate max-w-48">
                  • {artist} — {songTitle}
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowControls(!showControls)}
          className="flex h-5 w-10 items-center justify-center rounded-t-md border-x border-t border-zinc-200/50 bg-white/80 backdrop-blur-md dark:border-zinc-800/50 dark:bg-black/80 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          aria-label={showControls ? "Hide controls" : "Show controls"}
        >
          <svg
            className="h-3 w-3 transition-transform"
            style={{ transform: showControls ? "rotate(0deg)" : "rotate(180deg)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {youtubeId && (
        <div className="absolute opacity-0 pointer-events-none" style={{ width: 0, height: 0, overflow: "hidden" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}`}
            allow="autoplay"
            width="0"
            height="0"
          />
        </div>
      )}

      {musicSource?.type === "audio" && musicSource?.dataUrl && (
        <audio autoPlay loop className="hidden" src={musicSource.dataUrl} />
      )}
    </div>
  )
}

function reverseString(s: string) {
  return s.split("").reverse().join("")
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}
