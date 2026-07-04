"use client"

import { useState } from "react"
import type { LyricsResult } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  result: LyricsResult | null
  onLyrics?: (result: LyricsResult) => void
}

export default function SongInfo({ result, onLyrics }: Props) {
  const [showPaste, setShowPaste] = useState(false)
  const [pastedLyrics, setPastedLyrics] = useState("")

  if (!result) return null

  function handleUsePasted() {
    if (!pastedLyrics.trim() || !onLyrics || !result) return
    onLyrics({
      artist: result.artist,
      title: result.title,
      lyrics: pastedLyrics,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {result.artist} — {result.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {result.error && !result.lyrics ? (
          <div className="space-y-3">
            <p className="text-sm text-red-500 dark:text-red-400">{result.error}</p>
            {!showPaste && (
              <Button variant="outline" size="sm" onClick={() => setShowPaste(true)}>
                Paste Lyrics Manually
              </Button>
            )}
            {showPaste && (
              <div className="space-y-2">
                <textarea
                  value={pastedLyrics}
                  onChange={(e) => setPastedLyrics(e.target.value)}
                  placeholder="Paste the lyrics here..."
                  rows={6}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUsePasted} disabled={!pastedLyrics.trim()}>
                    Use These Lyrics
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPaste(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            {result.lyrics || "No lyrics loaded."}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
