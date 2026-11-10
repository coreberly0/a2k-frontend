'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Paperclip, Upload, Trash2, Loader2, FileText, ImageIcon, ExternalLink, X } from 'lucide-react'
import {
  PaymentFile, listPaymentFiles, uploadPaymentFiles, deletePaymentFile,
} from '@/lib/paymentFilesApi'

// same limits as the backend (attachments.js)
const MAX_MB = 5
const MAX_PER_UPLOAD = 10
const MAX_PER_RECORD = 20
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const size = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

type Props = {
  paymentId: string | null
  pending?: File[]                       // files chosen in Add mode
  onPendingChange?: (files: File[]) => void
}

export default function PaymentFiles({ paymentId, pending = [], onPendingChange }: Props) {
  const [files, setFiles] = useState<PaymentFile[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!paymentId) return
    setLoading(true)
    try {
      setFiles(await listPaymentFiles(paymentId))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load files')
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    load()
  }, [load])

  function validate(picked: File[], existing: number): string | null {
    if (picked.length > MAX_PER_UPLOAD) return `Choose up to ${MAX_PER_UPLOAD} files at a time`
    if (existing + picked.length > MAX_PER_RECORD) return `A payment can have up to ${MAX_PER_RECORD} files`
    const bad = picked.find((f) => !ALLOWED.includes(f.type))
    if (bad) return `${bad.name}: only PDF, JPG, PNG or WEBP files are allowed`
    const big = picked.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (big) return `${big.name}: each file must be ${MAX_MB} MB or smaller`
    return null
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = '' // allow picking the same file again
    if (picked.length === 0) return

    // ADD mode: just remember the files, upload happens after the payment is saved
    if (!paymentId) {
      const problem = validate(picked, pending.length)
      if (problem) return setError(problem)
      setError(null)
      onPendingChange?.([...pending, ...picked])
      return
    }

    // EDIT mode: upload right away
    const problem = validate(picked, files.length)
    if (problem) return setError(problem)

    setBusy(true)
    setError(null)
    try {
      await uploadPaymentFiles(paymentId, picked)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(f: PaymentFile) {
    if (!paymentId) return
    if (!window.confirm(`Delete "${f.name}"?`)) return
    setDeletingId(f.id)
    setError(null)
    try {
      await deletePaymentFile(paymentId, f.id)
      setFiles((prev) => prev.filter((x) => x.id !== f.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const count = paymentId ? files.length : pending.length

  return (
    <section className="mx-auto mt-6 max-w-2xl rounded-2xl border border-black/5 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Paperclip size={16} /> Receipts
          <span className="text-xs font-normal text-gravel">({count}/{MAX_PER_RECORD})</span>
        </h3>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={onPick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-ink transition hover:bg-black/5 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy ? 'Uploading…' : 'Add files'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ADD mode: files waiting to be uploaded */}
      {!paymentId ? (
        pending.length === 0 ? (
          <p className="py-2 text-sm text-gravel">
            No files chosen. PDF, JPG, PNG or WEBP, up to {MAX_MB} MB each. They upload when you click Add payment.
          </p>
        ) : (
          <ul className="divide-y divide-black/5">
            {pending.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper text-gravel">
                  {f.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                  <p className="text-xs text-gravel">{size(f.size)} · will upload on save</p>
                </div>
                <button
                  type="button"
                  onClick={() => onPendingChange?.(pending.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${f.name}`}
                  className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
                >
                  <X size={17} />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : loading ? (
        <div className="py-6 text-center text-gravel">
          <Loader2 className="mx-auto animate-spin" size={20} />
        </div>
      ) : files.length === 0 ? (
        <p className="py-2 text-sm text-gravel">
          No receipts yet. PDF, JPG, PNG or WEBP, up to {MAX_MB} MB each.
        </p>
      ) : (
        <ul className="divide-y divide-black/5">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper text-gravel">
                {f.mime_type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                <p className="text-xs text-gravel">{size(f.size_bytes)}</p>
              </div>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${f.name}`}
                  className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                >
                  <ExternalLink size={17} />
                </a>
              )}
              <button
                type="button"
                onClick={() => onDelete(f)}
                disabled={deletingId === f.id}
                aria-label={`Delete ${f.name}`}
                className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
              >
                {deletingId === f.id ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}