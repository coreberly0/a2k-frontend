'use client'
import { Pencil, Trash2 } from 'lucide-react'

type Props = {
  onEdit?: () => void
  onDelete?: () => void
}

export default function RowActions({ onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
          className="rounded-md p-2 text-steel transition-colors hover:bg-steel/10
            focus-visible:outline-2 focus-visible:outline-steel"
        >
          <Pencil size={16} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          title="Delete"
          className="rounded-md p-2 text-red-600 transition-colors hover:bg-red-50
            focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}