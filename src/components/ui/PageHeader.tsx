import { Plus } from 'lucide-react'

type Props = { title: string; addLabel: string; onAdd: () => void }

export default function PageHeader({ title, addLabel, onAdd }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">{title}</h1>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-blue-600 text-white rounded px-4 py-2 text-sm"
      >
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  )
}