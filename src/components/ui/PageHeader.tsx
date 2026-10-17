'use client'
import { Plus } from 'lucide-react'

type Props = {
  title: string
  addLabel: string
  onAdd: () => void
  /** Optional grey line under the title */
  description?: string
}

export default function PageHeader({ title, addLabel, onAdd, description }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-gravel">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
      >
        <Plus size={18} /> {addLabel}
      </button>
    </div>
  )
}