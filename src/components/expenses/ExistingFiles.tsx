'use client'
import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getUser, isAdmin } from '@/lib/auth'

type Attachment = {
  id: string
  file_name: string
  file_size: number
  url: string | null
}

export default function ExistingFiles({ expenseId }: { expenseId: string }) {
  const [items, setItems] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setItems(await api<Attachment[]>(`/expenses/${expenseId}/attachments`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load files')
    } finally {
      setLoading(false)
    }
  }, [expenseId])

  useEffect(() => {
    setAdmin(isAdmin(getUser()))
    load()
  }, [load])

  async function handleDelete(a: Attachment) {
    if (!window.confirm(`Delete "${a.file_name}"?`)) return
    try {
      await api(`/expenses/${expenseId}/attachments/${a.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">Files already attached</label>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-xs">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-xs">No files attached yet</p>
      ) : (
        <ul className="divide-y border rounded">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{a.file_name}</p>
                <p className="text-gray-500 text-xs">{Math.ceil(a.file_size / 1024)} KB</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open"
                    className="text-blue-600"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                {admin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    aria-label="Delete"
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}