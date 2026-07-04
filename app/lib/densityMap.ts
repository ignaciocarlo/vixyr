const FALLBACK_RANKED = "@%#*+=-:. ".split("")

export function buildDensityMap(lyrics: string): string[] {
  const unique = new Set<string>()
  for (const ch of lyrics) {
    if (ch.trim() || ch === " ") unique.add(ch)
  }

  const chars = Array.from(unique)
  if (chars.length === 0) return FALLBACK_RANKED

  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return FALLBACK_RANKED

    ctx.font = "16px monospace"

    const measured = chars.map((ch) => ({
      char: ch,
      width: ctx.measureText(ch).width,
    }))

    measured.sort((a, b) => b.width - a.width)
    return measured.map((m) => m.char)
  } catch {
    chars.sort()
    return chars.length > 1 ? chars : FALLBACK_RANKED
  }
}
