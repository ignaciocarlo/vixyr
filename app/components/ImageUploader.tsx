"use client"

import { useRef, useState, useEffect } from "react"

interface Props {
  onImageSelect: (file: File) => void
}

export default function ImageUploader({ onImageSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    if (preview) URL.revokeObjectURL(preview)
    const url = URL.createObjectURL(file)
    setPreview(url)
    onImageSelect(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors
          ${dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"}
          ${preview ? "p-2" : "p-8"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="h-full max-w-full rounded-lg object-contain"
          />
        ) : (
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <p className="text-lg font-medium">Drop an image here</p>
            <p className="mt-1 text-sm">or click to browse</p>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Tip: Use a portrait image or keep the subject far away to capture the shape better.
      </p>
    </div>
  )
}
