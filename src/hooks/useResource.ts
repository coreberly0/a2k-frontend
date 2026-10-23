import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getUser, isAdmin } from '@/lib/auth'

export function useResource<T extends { id: string }>(path: string, query = '') {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleting, setDeleting] = useState<T | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setRows(await api<T[]>(`${path}${query}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [path, query])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setAdmin(isAdmin(getUser()))
  }, [])

  function openAdd() {
    setEditing(null)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(row: T) {
    setEditing(row)
    setFormError('')
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  /**
   * Saves the row, then runs the optional `after` step (for example the bill
   * file upload) with the saved row, then reloads the list.
   */
  async function save(values: unknown, after?: (saved: T) => Promise<void>) {
    setSaving(true)
    setFormError('')
    try {
      // POST and PATCH both return the saved row (it has the id)
      const saved = editing
        ? await api<T>(`${path}/${editing.id}`, { method: 'PATCH', body: values })
        : await api<T>(path, { method: 'POST', body: values })

      let afterError = ''
      if (after) {
        try {
          await after(saved)
        } catch (e) {
          afterError = e instanceof Error ? e.message : 'File step failed'
        }
      }

      closeForm()
      await load()
      // the row itself is saved; only the file step failed
      if (afterError) {
        setError(`Saved, but the bill copy failed: ${afterError}. Open Edit to try again.`)
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`${path}/${deleting.id}`, { method: 'DELETE' })
      setDeleting(null)
      await load()
    } catch (e) {
      setDeleting(null)
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleteBusy(false)
    }
  }

  return {
    rows, loading, error, admin,
    formOpen, editing, saving, formError,
    deleting, deleteBusy,
    openAdd, openEdit, closeForm, save,
    askDelete: (row: T) => setDeleting(row),
    cancelDelete: () => setDeleting(null),
    confirmDelete,
  }
}