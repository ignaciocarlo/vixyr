"use client"

import { useState } from "react"
import { fetchLyrics } from "../lib/lyricsService"
import type { LyricsResult } from "../types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  onLyrics: (result: LyricsResult) => void
}

export default function SongSearch({ onLyrics }: Props) {
  const [artist, setArtist] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleFetch() {
    if (!artist.trim() || !title.trim()) {
      setError("Enter both artist and song title")
      return
    }
    setLoading(true)
    setError("")
    const result = await fetchLyrics(artist, title)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    }
    onLyrics(result)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
        <Input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song Title"
        />
        <Button onClick={handleFetch} disabled={loading}>
          {loading ? "Fetching..." : "Fetch Lyrics"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
