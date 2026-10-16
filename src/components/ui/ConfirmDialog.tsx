'use client'
import Modal from '@/components/ui/Modal'

interface ConfirmDialogProps {
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
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      size="sm"
      onClose={busy ? () => {} : onCancel}
      closeOnBackdrop={!busy}
      icon={
        <svg viewBox="0 0 24 24" className="size-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        </svg>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 flex-1 rounded-xl bg-neutral-100 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-10 flex-1 rounded-xl bg-red-600 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}