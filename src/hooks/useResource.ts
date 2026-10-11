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

  async function save(values: unknown) {
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await api(`${path}/${editing.id}`, { method: 'PATCH', body: values })
      } else {
        await api(path, { method: 'POST', body: values })
      }
      closeForm()
      await load()
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