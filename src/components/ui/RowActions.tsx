import { Pencil, Trash2 } from 'lucide-react'

type Props = { onEdit: () => void; onDelete?: () => void }

export default function RowActions({ onEdit, onDelete }: Props) {
  return (
    <div className="flex justify-end gap-3">
      <button onClick={onEdit} aria-label="Edit" className="text-blue-600">
        <Pencil size={16} />
      </button>
      {onDelete && (
        <button onClick={onDelete} aria-label="Delete" className="text-red-600">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}