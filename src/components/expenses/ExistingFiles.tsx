'use client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getUser, isAdmin } from '@/lib/auth'
import FileRow, { Attachment } from './FileRow'

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
    try {
      await api(`/expenses/${expenseId}/attachments/${a.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">Already attached</p>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center rounded-xl border border-black/10 bg-paper/60 py-5 text-gravel">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 bg-paper/60 px-4 py-4 text-center text-xs text-gravel">
          No files attached yet
        </p>
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
          {items.map((a) => (
            <FileRow key={a.id} a={a} canDelete={admin} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  )
}