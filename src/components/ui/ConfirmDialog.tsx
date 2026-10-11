'use client'
import Modal from './Modal'

type Props = {
  open: boolean
  title: string
  message: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-gray-700 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded border text-sm">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="px-4 py-2 rounded bg-red-600 text-white text-sm disabled:opacity-50"
        >
          {busy ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}