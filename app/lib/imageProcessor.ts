import type { ProcessedImage } from "../types"

export function processImage(
  imageData: ImageData,
  width: number,
  densityChars: string[]
): ProcessedImage {
  const srcW = imageData.width
  const srcH = imageData.height
  const CHAR_RATIO = 0.55
  const LINE_HEIGHT = 1.1
  const outH = Math.round(srcH * (width / srcW) * (CHAR_RATIO / LINE_HEIGHT))

  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = srcW
  tempCanvas.height = srcH
  const tempCtx = tempCanvas.getContext("2d")
  if (!tempCtx) return { charGrid: [], width: 0, height: 0 }
  tempCtx.putImageData(imageData, 0, 0)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) return { charGrid: [], width: 0, height: 0 }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(tempCanvas, 0, 0, width, outH)

  const smallData = ctx.getImageData(0, 0, width, outH)
  const pix = smallData.data

  const charGrid: string[][] = []
  const charsLen = densityChars.length
  if (charsLen === 0) return { charGrid: [], width: 0, height: 0 }

  for (let y = 0; y < outH; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const gray = 0.299 * pix[idx] + 0.587 * pix[idx + 1] + 0.114 * pix[idx + 2]
      const charIdx = Math.floor((gray / 255) * (charsLen - 1))
      const clamped = Math.max(0, Math.min(charsLen - 1, charIdx))
      row.push(densityChars[clamped])
    }
    charGrid.push(row)
  }

  return { charGrid, width, height: outH }
}

export function processImageWithWords(
  imageData: ImageData,
  width: number,
  lyrics: string,
  invert: boolean = false
): ProcessedImage {
  const srcW = imageData.width
  const srcH = imageData.height
  const CHAR_RATIO = 0.55
  const LINE_HEIGHT = 1.1
  const outH = Math.round(srcH * (width / srcW) * (CHAR_RATIO / LINE_HEIGHT))

  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = srcW
  tempCanvas.height = srcH
  const tempCtx = tempCanvas.getContext("2d")
  if (!tempCtx) return { charGrid: [], width: 0, height: 0 }
  tempCtx.putImageData(imageData, 0, 0)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) return { charGrid: [], width: 0, height: 0 }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(tempCanvas, 0, 0, width, outH)

  const smallData = ctx.getImageData(0, 0, width, outH)
  const pix = smallData.data
  const total = width * outH

  const bright = new Array(total)
  let bMin = 255, bMax = 0
  for (let i = 0; i < total; i++) {
    const idx = i * 4
    const gray = 0.299 * pix[idx] + 0.587 * pix[idx + 1] + 0.114 * pix[idx + 2]
    bright[i] = gray
    if (gray < bMin) bMin = gray
    if (gray > bMax) bMax = gray
  }

  if (bMax > bMin) {
    const range = bMax - bMin
    for (let i = 0; i < total; i++) {
      bright[i] = ((bright[i] - bMin) / range) * 255
    }
  }

  const hist = new Array(256).fill(0)
  for (const b of bright) hist[Math.round(b)]++
  const threshold = otsuThreshold(hist, total)

  const mask = new Array(total)
  for (let i = 0; i < total; i++) {
    mask[i] = bright[i] < threshold
  }

  const cleaned = morphOpen(mask, width, outH)

  if (invert) {
    for (let i = 0; i < total; i++) cleaned[i] = !cleaned[i]
  }

  const words = lyrics.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return { charGrid: [], width: 0, height: 0 }

  const MIN_SEG = Math.max(4, Math.round(width * 0.03))
  const charGrid: string[][] = []
  let wordIdx = 0

  for (let y = 0; y < outH; y++) {
    const row = new Array(width).fill(" ")
    const segments = findSegments(cleaned, y, width, MIN_SEG)

    for (const [s, e] of segments) {
      let pos = s
      let stuck = 0
      while (pos < e && stuck < words.length) {
        if (wordIdx >= words.length) wordIdx = 0
        const word = words[wordIdx]
        if (word.length <= e - pos) {
          for (let i = 0; i < word.length; i++) row[pos + i] = word[i]
          pos += word.length
          wordIdx++
          stuck = 0
          if (pos < e) { row[pos] = " "; pos++ }
        } else {
          wordIdx++
          stuck++
        }
      }
    }

    charGrid.push(row)
  }

  return { charGrid, width, height: outH }
}

function otsuThreshold(hist: number[], total: number): number {
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]

  let sumB = 0, wB = 0
  let maxVariance = 0, threshold = 0

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break

    sumB += t * hist[t]
    const meanB = sumB / wB
    const meanF = (sum - sumB) / wF
    const diff = meanB - meanF
    const betweenVar = wB * wF * diff * diff

    if (betweenVar > maxVariance) {
      maxVariance = betweenVar
      threshold = t
    }
  }

  return threshold
}

function morphOpen(mask: boolean[], w: number, h: number): boolean[] {
  const eroded = new Array(mask.length).fill(false)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
        eroded[y * w + x] = mask[y * w + x]
        continue
      }
      let all = true
      for (let dy = -1; dy <= 1 && all; dy++) {
        for (let dx = -1; dx <= 1 && all; dx++) {
          if (!mask[(y + dy) * w + (x + dx)]) all = false
        }
      }
      eroded[y * w + x] = all
    }
  }

  const opened = new Array(mask.length).fill(false)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
        opened[y * w + x] = eroded[y * w + x]
        continue
      }
      let any = false
      for (let dy = -1; dy <= 1 && !any; dy++) {
        for (let dx = -1; dx <= 1 && !any; dx++) {
          if (eroded[(y + dy) * w + (x + dx)]) any = true
        }
      }
      opened[y * w + x] = any
    }
  }

  return opened
}

function findSegments(
  mask: boolean[], row: number, w: number, minSeg: number
): [number, number][] {
  const segments: [number, number][] = []
  let start: number | null = null

  for (let x = 0; x < w; x++) {
    if (mask[row * w + x] && start === null) {
      start = x
    } else if (!mask[row * w + x] && start !== null) {
      if (x - start >= minSeg) segments.push([start, x])
      start = null
    }
  }

  if (start !== null && w - start >= minSeg) {
    segments.push([start, w])
  }

  return segments
}

export function loadImage(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to get canvas context"))
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      URL.revokeObjectURL(url)
      resolve(imageData)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}
