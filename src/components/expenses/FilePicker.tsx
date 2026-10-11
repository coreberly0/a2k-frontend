'use client'
import { useEffect, useRef, useState } from 'react'
import { FileText, X } from 'lucide-react'

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
    <div className="space-y-2">
      <label className="block text-sm">Attachments (image or PDF)</label>

      <label
        className={`inline-block px-3 py-2 rounded border text-sm bg-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
        }`}
      >
        Choose files
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
      <span className="text-xs text-gray-500 ml-2">Up to {maxFiles} files, 5 MB each</span>

      {message && <p className="text-red-600 text-xs">{message}</p>}

      {files.length > 0 && (
        <ul className="divide-y border rounded">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[i]!} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <FileText size={28} className="text-gray-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate">{f.name}</p>
                <p className="text-xs text-gray-500">{Math.ceil(f.size / 1024)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove file"
                className="text-red-600"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}