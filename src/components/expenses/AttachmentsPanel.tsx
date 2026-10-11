'use client'
import { useCallback, useEffect, useState } from 'react'
import { Trash2, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import FilePicker from './FilePicker'

type Attachment = {
  id: string
  file_name: string
  file_type: string
  file_size: number
  url: string | null
}

export default function AttachmentsPanel({
  expenseId,
  admin,
}: {
  expenseId: string
  admin: boolean
}) {
  const [items, setItems] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setItems(await api<Attachment[]>(`/expenses/${expenseId}/attachments`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [expenseId])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpload() {
    if (picked.length === 0) return
    setUploading(true)
    setError('')
    let uploadError = ''
    try {
      const fd = new FormData()
      picked.forEach((f) => fd.append('files', f))
      await api(`/expenses/${expenseId}/attachments`, { method: 'POST', body: fd })
      setPicked([])
    } catch (e) {
      uploadError = e instanceof Error ? e.message : 'Upload failed'
    } finally {
      // always reload, because some files may have been saved before an error
      await load()
      if (uploadError) setError(uploadError)
      setUploading(false)
    }
  }

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
    <div className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm">No files yet</p>
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

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium">Add files</p>
        <FilePicker files={picked} onChange={setPicked} disabled={uploading} />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || picked.length === 0}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : picked.length ? `Upload ${picked.length}` : 'Upload'}
        </button>
      </div>
    </div>
  )
}