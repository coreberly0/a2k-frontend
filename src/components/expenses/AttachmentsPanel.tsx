'use client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Paperclip, Upload } from 'lucide-react'
import { api } from '@/lib/api'
import FilePicker from './FilePicker'
import FileRow, { Attachment } from './FileRow'

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
    try {
      await api(`/expenses/${expenseId}/attachments/${a.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h3 className="flex items-center gap-3 text-sm font-semibold text-ink">
          Attached files
          {!loading && (
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-gravel">
              {items.length}
            </span>
          )}
          <span className="h-px flex-1 bg-black/5" />
        </h3>

        {loading ? (
          <div className="flex justify-center rounded-xl border border-black/10 bg-paper/60 py-8 text-gravel">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-paper/60 px-4 py-8 text-center">
            <span className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-white text-gravel">
              <Paperclip size={20} />
            </span>
            <p className="text-sm font-medium text-ink">No files yet</p>
            <p className="mt-0.5 text-xs text-gravel">Add bills or receipts below.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
            {items.map((a) => (
              <FileRow key={a.id} a={a} canDelete={admin} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-3 text-sm font-semibold text-ink">
          Add files
          <span className="h-px flex-1 bg-black/5" />
        </h3>
        <FilePicker files={picked} onChange={setPicked} disabled={uploading} />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || picked.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-signal py-3 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {uploading ? 'Uploading…' : picked.length ? `Upload ${picked.length} file${picked.length > 1 ? 's' : ''}` : 'Upload'}
        </button>
      </section>
    </div>
  )
}