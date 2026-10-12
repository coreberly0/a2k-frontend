'use client'
import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
      >
        <div className="hazard h-1.5" />
        <div className="flex gap-4 p-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <TriangleAlert size={20} />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-display text-xl font-bold">
              {title}
            </h2>
            <p className="mt-1 text-sm text-ink/70">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 bg-paper px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            autoFocus
            className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-medium
              hover:bg-ink/5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-steel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-red-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-red-600"
          >
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}