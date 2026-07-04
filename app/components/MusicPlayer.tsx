"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MusicSource } from "../types"

interface Props {
  source: MusicSource | null
  onSourceChange: (src: MusicSource | null) => void
}

export default function MusicPlayer({ source, onSourceChange }: Props) {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [audioTitle, setAudioTitle] = useState("")
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl)
    }
  }, [audioBlobUrl])

  function handleYoutubeSubmit() {
    const id = extractYoutubeId(youtubeUrl)
    if (!id) return
    onSourceChange({ type: "youtube", url: youtubeUrl, title: youtubeUrl })
    setExpanded(true)
  }

  function handleYtBlur() {
    const id = extractYoutubeId(youtubeUrl)
    if (id && youtubeUrl.trim()) {
      onSourceChange({ type: "youtube", url: youtubeUrl, title: youtubeUrl })
      setExpanded(true)
    }
  }

  function handleAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl)
    const url = URL.createObjectURL(file)
    setAudioBlobUrl(url)
    onSourceChange({ type: "audio", file, title: file.name })
    setAudioTitle(file.name)
    setExpanded(true)
  }

  function handleClear() {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl)
      setAudioBlobUrl(null)
    }
    onSourceChange(null)
    setYoutubeUrl("")
    setAudioTitle("")
  }

  return (
    <div className="relative rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
          <span className="truncate">{source?.title || "Background Music"}</span>
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onBlur={handleYtBlur}
              placeholder="Paste YouTube URL..."
              className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            />
            <Button onClick={handleYoutubeSubmit} variant="default">
              Play
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
            <span>OR</span>
            <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => audioInputRef.current?.click()}>
              {audioTitle || "Upload Audio File"}
            </Button>
            {audioTitle && (
              <span className="truncate text-xs text-zinc-500">{audioTitle}</span>
            )}
          </div>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioFile}
            className="hidden"
          />

          {source?.type === "audio" && source.file && audioBlobUrl && (
            <audio controls autoPlay loop className="w-full" src={audioBlobUrl} />
          )}

          {source && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600">
              Remove music
            </Button>
          )}
        </div>
      )}

      {source?.type === "youtube" && (() => {
        const id = extractYoutubeId(source.url || "")
        if (!id) return null
        return (
          <div className="absolute opacity-0 pointer-events-none" style={{ width: 0, height: 0, overflow: "hidden" }}>
            <iframe
              src={`https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}`}
              allow="autoplay"
              width="0"
              height="0"
            />
          </div>
        )
      })()}
    </div>
  )
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
