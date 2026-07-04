export interface LyricsResult {
  artist: string
  title: string
  lyrics: string
  error?: string
}

export interface ProcessedImage {
  charGrid: string[][]
  width: number
  height: number
}

export type ViewMode = "html" | "text"

export type ArtMode = "char" | "word"

export interface MusicSource {
  type: "youtube" | "audio"
  url?: string
  file?: File
  title?: string
}
