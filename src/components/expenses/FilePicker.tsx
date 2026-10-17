'use client'
import { useEffect, useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import { fmtSize } from './FileRow'

export const MAX_FILES = 5
export const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']

function isAllowed(f: File) {
  if (ALLOWED_TYPES.includes(f.type)) return true
  // some systems give an empty type, so fall back to the extension
  const name = f.name.toLowerCase()
  return !f.type && ALLOWED_EXT.some((ext) => name.endsWith(ext))
}

type Props = {
  files: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
}

export default function FilePicker({ files, onChange, maxFiles = MAX_FILES, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [previews, setPreviews] = useState<(string | null)[]>([])
  const [dragging, setDragging] = useState(false)

  // Create and clean up preview URLs inside the effect so React strict mode cannot break them
  useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null))
    setPreviews(urls)
    return () => {
      urls.forEach((u) => {
        if (u) URL.revokeObjectURL(u)
      })
    }
  }, [files])

  function handlePick(list: FileList | null) {
    setMessage('')
    const picked = Array.from(list ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (picked.length === 0) return

    const notAllowed = picked.find((f) => !isAllowed(f))
    if (notAllowed) {
      setMessage(`"${notAllowed.name}" is not allowed. Use JPG, PNG, WEBP or PDF.`)
      return
    }
    const tooBig = picked.find((f) => f.size > MAX_SIZE)
    if (tooBig) {
      setMessage(`"${tooBig.name}" is bigger than 5 MB.`)
      return
    }
    if (files.length + picked.length > maxFiles) {
      setMessage(`You can attach up to ${maxFiles} files.`)
      return
    }
    onChange([...files, ...picked])
  }

  function remove(index: number) {
    setMessage('')
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) handlePick(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          disabled
            ? 'cursor-not-allowed border-black/10 opacity-50'
            : dragging
              ? 'cursor-pointer border-signal bg-signal/10'
              : 'cursor-pointer border-black/15 bg-paper/60 hover:border-signal hover:bg-signal/5'
        }`}
      >
        <span className="grid size-11 place-items-center rounded-full bg-signal/20 text-ink">
          <UploadCloud size={22} />
        </span>
        <p className="text-sm font-medium text-ink">
          Click to upload <span className="font-normal text-gravel">or drag and drop</span>
        </p>
        <p className="text-xs text-gravel">
          JPG, PNG, WEBP or PDF. Up to {maxFiles} files, 5 MB each.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={disabled}
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={(e) => handlePick(e.target.files)}
          className="hidden"
        />
      </label>

      {message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {message}
        </p>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3.5 py-3">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[i]!} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                  <FileText size={20} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                <p className="text-xs text-gravel">{fmtSize(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
              >
                <X size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}