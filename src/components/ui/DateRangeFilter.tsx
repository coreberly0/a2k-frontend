type Props = {
  from: string
  to: string
  onFrom: (v: string) => void
  onTo: (v: string) => void
}

export default function DateRangeFilter({ from, to, onFrom, onTo }: Props) {
  const cls = 'border rounded px-3 py-2 text-sm bg-white'
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">From</label>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">To</label>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={cls} />
      </div>
      {(from || to) && (
        <button
          onClick={() => {
            onFrom('')
            onTo('')
          }}
          className="px-3 py-2 text-sm border rounded bg-white"
        >
          Clear
        </button>
      )}
    </div>
  )
}