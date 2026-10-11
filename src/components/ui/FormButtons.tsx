export default function FormButtons({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded border text-sm">
        Cancel
      </button>
      <button
        disabled={saving}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}