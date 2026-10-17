'use client'
import { useState } from 'react'
import { ExternalLink, FileText, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react'

export type Attachment = {
  id: string
  file_name: string
  file_type?: string
  file_size: number
  url: string | null
}

export function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`
}

export default function FileRow({
  a,
  canDelete,
  onDelete,
}: {
  a: Attachment
  canDelete: boolean
  onDelete: (a: Attachment) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const isPdf = a.file_name.toLowerCase().endsWith('.pdf')

  async function remove() {
    setBusy(true)
    try {
      await onDelete(a)
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg ${
          isPdf ? 'bg-red-50 text-red-600' : 'bg-signal/20 text-ink'
        }`}
      >
        {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{a.file_name}</p>
        <p className="text-xs text-gravel">{fmtSize(a.file_size)}</p>
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs text-gravel">Delete?</span>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={12} className="animate-spin" />} Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-black/5"
          >
            No
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-0.5">
          {a.url && (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${a.file_name}`}
              className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
            >
              <ExternalLink size={17} />
            </a>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${a.file_name}`}
              className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      )}
    </li>
  )
}