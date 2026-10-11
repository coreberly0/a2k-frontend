'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react'
import { api } from '@/lib/api'
import { getUser, isAdmin } from '@/lib/auth'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ExpenseForm, { Expense, ExpenseValues, Option } from '@/components/expenses/ExpenseForm'
import AttachmentsPanel from '@/components/expenses/AttachmentsPanel'

const money = (n: number | string) => '₹' + Number(n).toLocaleString('en-IN')

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(false)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [categories, setCategories] = useState<Option[]>([])
  const [vehicles, setVehicles] = useState<Option[]>([])
  const [drivers, setDrivers] = useState<Option[]>([])
  const [vendors, setVendors] = useState<Option[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)
  const [failedLookups, setFailedLookups] = useState<string[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [filesFor, setFilesFor] = useState<Expense | null>(null)

  const load = useCallback(async () => {
    try {
      setError('')
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const query = qs.toString()
      setExpenses(await api<Expense[]>(`/expenses${query ? `?${query}` : ''}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setAdmin(isAdmin(getUser()))

    async function loadLookups() {
      const paths = ['/expense-categories', '/vehicles', '/drivers', '/vendors']
      const results = await Promise.allSettled(paths.map((p) => api<any[]>(p)))
      const rows = (i: number): any[] => {
        const r = results[i]
        return r.status === 'fulfilled' ? r.value : []
      }

      setFailedLookups(paths.filter((_, i) => results[i].status === 'rejected'))
      setCategories(rows(0).map((r) => ({ id: r.id, label: r.name })))
      setVehicles(
        rows(1).map((r) => ({
          id: r.id,
          label: r.type ? `${r.plate_number} (${r.type})` : r.plate_number,
        }))
      )
      setDrivers(rows(2).map((r) => ({ id: r.id, label: r.full_name })))
      setVendors(rows(3).map((r) => ({ id: r.id, label: r.name })))
      setLookupsLoading(false)
    }
    loadLookups()
  }, [])

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  )

  function openAdd() {
    setEditing(null)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(e: Expense) {
    setEditing(e)
    setFormError('')
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSave(values: ExpenseValues, files: File[]) {
    setSaving(true)
    setFormError('')
    try {
      const saved = editing
        ? await api<Expense>(`/expenses/${editing.id}`, { method: 'PATCH', body: values })
        : await api<Expense>('/expenses', { method: 'POST', body: values })

      let uploadError = ''
      if (files.length > 0) {
        try {
          const fd = new FormData()
          files.forEach((f) => fd.append('files', f))
          await api(`/expenses/${saved.id}/attachments`, { method: 'POST', body: fd })
        } catch (e) {
          uploadError = e instanceof Error ? e.message : 'Upload failed'
        }
      }

      closeForm()
      await load()

      if (uploadError) {
        setError(`Expense saved, but the files were not uploaded: ${uploadError}`)
        setFilesFor(saved)
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api(`/expenses/${deleting.id}`, { method: 'DELETE' })
      setDeleting(null)
      await load()
    } catch (e) {
      setDeleting(null)
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Expenses</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white rounded px-4 py-2 text-sm"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-white"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom('')
              setTo('')
            }}
            className="px-3 py-2 text-sm border rounded bg-white"
          >
            Clear
          </button>
        )}
        <p className="ml-auto text-sm">
          Total: <span className="font-bold">{money(total)}</span>
        </p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DataTable<Expense>
          columns={[
            { header: 'Date', render: (e) => e.expense_date?.slice(0, 10) },
            { header: 'Category', render: (e) => e.category?.name || '-' },
            { header: 'Vehicle', render: (e) => e.vehicle?.plate_number || '-' },
            { header: 'Driver', render: (e) => e.driver?.full_name || '-' },
            { header: 'Vendor', render: (e) => e.vendor?.name || '-' },
            { header: 'Amount', render: (e) => money(e.amount) },
          ]}
          rows={expenses}
          rowKey={(e) => e.id}
          actions={(e) => (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setFilesFor(e)}
                aria-label="Files"
                title="View files"
                className="text-gray-600"
              >
                <Paperclip size={16} />
              </button>
              <button onClick={() => openEdit(e)} aria-label="Edit" className="text-blue-600">
                <Pencil size={16} />
              </button>
              {admin && (
                <button
                  onClick={() => setDeleting(e)}
                  aria-label="Delete"
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        />
      )}

      <Modal open={formOpen} title={editing ? 'Edit Expense' : 'Add Expense'} onClose={closeForm}>
        <ExpenseForm
          key={editing?.id ?? 'new'}
          initial={editing}
          categories={categories}
          vehicles={vehicles}
          drivers={drivers}
          vendors={vendors}
          lookupsLoading={lookupsLoading}
          failedLookups={failedLookups}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onCancel={closeForm}
        />
      </Modal>

      <Modal open={!!filesFor} title="Files" onClose={() => setFilesFor(null)}>
        {filesFor && <AttachmentsPanel key={filesFor.id} expenseId={filesFor.id} admin={admin} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete expense"
        message="Delete this expense and all its files? This cannot be undone."
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}