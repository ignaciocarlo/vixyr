import type { LyricsResult } from "../types"

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  if (!artist.trim() || !title.trim()) {
    return { artist, title, lyrics: "", error: "Artist and title are required" }
  }

  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist.trim())}/${encodeURIComponent(title.trim())}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status === 404) {
        return {
          artist,
          title,
          lyrics: "",
          error: "Lyrics not found for this song. Try different spelling?",
        }
      }
      return {
        artist,
        title,
        lyrics: "",
        error: `API error (${res.status})`,
      }
    }

    const data = await res.json()
    if (!data.lyrics) {
      return {
        artist,
        title,
        lyrics: "",
        error: "No lyrics returned from API",
      }
    }

    return { artist, title, lyrics: data.lyrics }
  } catch {
    return {
      artist,
      title,
      lyrics: "",
      error: "Network error. Check your connection and try again.",
    }
  }
}
