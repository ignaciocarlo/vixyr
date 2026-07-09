"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import ImageUploader from "./components/ImageUploader"
import SongSearch from "./components/SongSearch"
import SongInfo from "./components/SongInfo"
import MusicPlayer from "./components/MusicPlayer"
import { loadImage } from "./lib/imageProcessor"
import { useTheme } from "./ThemeProvider"
import { Button } from "@/components/ui/button"
import type { LyricsResult, MusicSource } from "./types"
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  const router = useRouter()
  const { theme, toggle } = useTheme()

  const [lyricsResult, setLyricsResult] = useState<LyricsResult | null>(null)
  const [musicSource, setMusicSource] = useState<MusicSource | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState("")

  const handleImageSelect = useCallback((file: File) => {
    setImageError("")
    setImageDataUrl(null)

    loadImage(file)
      .then(() => {
        const reader = new FileReader()
        reader.onload = () => {
          setImageDataUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
      .catch(() => {
        setImageError("Failed to process image")
      })
  }, [])

  const handleLyrics = useCallback((result: LyricsResult) => {
    setLyricsResult(result)
  }, [])

  const canGenerate = imageDataUrl !== null && !!lyricsResult?.lyrics && !lyricsResult?.error

  async function handleGenerate() {
    if (!canGenerate || !lyricsResult) return

    let musicData = null
    if (musicSource) {
      if (musicSource.type === "audio" && musicSource.file) {
        musicData = {
          type: "audio" as const,
          title: musicSource.title,
          dataUrl: await fileToDataUrl(musicSource.file),
        }
      } else if (musicSource.type === "youtube") {
        musicData = musicSource
      }
    }

    sessionStorage.setItem("vixyr_image", imageDataUrl!)
    sessionStorage.setItem("vixyr_artist", lyricsResult.artist)
    sessionStorage.setItem("vixyr_title", lyricsResult.title)
    sessionStorage.setItem("vixyr_lyrics", lyricsResult.lyrics)
    sessionStorage.setItem("vixyr_music", JSON.stringify(musicData))
    router.push("/result")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Vixyr
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Turn images into lyric art
          </p>
        </div>
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
      </header>

      <main className="flex flex-1 flex-col gap-6" aria-label="Upload and configure your image and song">
        <ImageUploader onImageSelect={handleImageSelect} />
        {imageError && (
          <p className="text-sm text-red-500">{imageError}</p>
        )}

        <SongSearch onLyrics={handleLyrics} />
        <SongInfo result={lyricsResult} onLyrics={handleLyrics} />
        <MusicPlayer source={musicSource} onSourceChange={setMusicSource} />
        <Button
          size="lg"
          disabled={!canGenerate}
          onClick={handleGenerate}
          className="mt-2 w-full"
        >
          Generate Art
        </Button>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Your image is processed entirely in your browser and never stored — it is cleared as soon as the art is generated.
        </p>
      </main>
      <Analytics />
    </div>
    
  )
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
