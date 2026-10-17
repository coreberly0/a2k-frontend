'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Paperclip, Loader2, AlertTriangle, X,
  Receipt, IndianRupee, Tag, CalendarDays,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getUser, isAdmin } from '@/lib/auth'
import Modal from '@/components/ui/Modal'
import { FormActions } from '@/components/ui/formKit'
import ExpenseForm, { EXPENSE_FORM_ID, Expense, ExpenseValues, Option } from '@/components/expenses/ExpenseForm'
import AttachmentsPanel from '@/components/expenses/AttachmentsPanel'

const money = (n: number | string) => '₹' + Number(n).toLocaleString('en-IN')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-10-18..." -> "18 Oct 2026"
function fmtDate(v: unknown) {
  const s = String(v ?? '').slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return '-'
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(false)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

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

  // close the delete dialog with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleting && !deleteBusy) setDeleting(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleting, deleteBusy])

  // search runs on the rows already loaded
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return expenses
    return expenses.filter((e) =>
      [e.category?.name, e.vehicle?.plate_number, e.driver?.full_name, e.vendor?.name].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [expenses, search])

  const total = useMemo(() => rows.reduce((sum, e) => sum + Number(e.amount || 0), 0), [rows])

  const topCategory = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((e) => {
      const k = e.category?.name || 'Uncategorised'
      m.set(k, (m.get(k) || 0) + Number(e.amount || 0))
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0] ?? null
  }, [rows])

  const hasFilter = !!(from || to || search)
  function clearFilters() {
    setFrom('')
    setTo('')
    setSearch('')
  }

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

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditing(null)
  }, [])

  const closeFiles = useCallback(() => setFilesFor(null), [])

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

  const dateWrap =
    'flex items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20'
  const dateInput = 'bg-transparent py-2.5 text-sm text-ink outline-none'

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Expenses</h1>
          <p className="mt-1 text-sm text-gravel">Fuel, repairs, tolls and everything else you spend.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* summary cards (they follow the filters below) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <Receipt size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{rows.length}</p>
            <p className="mt-1 text-xs text-gravel">Total entries</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-signal">
            <IndianRupee size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{money(total)}</p>
            <p className="mt-1 text-xs text-gravel">Total expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-signal/20 text-ink">
            <Tag size={22} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold leading-none text-ink">{topCategory ? topCategory[0] : '-'}</p>
            <p className="mt-1 truncate text-xs text-gravel">
              Top category{topCategory ? ` · ${money(topCategory[1])}` : ''}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* table card */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
          <div className={`${dateWrap} min-w-[220px] flex-1 sm:max-w-xs`}>
            <Search size={18} className="shrink-0 text-gravel" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category, vehicle, driver"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={dateWrap}>
              <CalendarDays size={18} className="shrink-0 text-gravel" />
              <span className="text-xs text-gravel">From</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
            </div>
            <div className={dateWrap}>
              <CalendarDays size={18} className="shrink-0 text-gravel" />
              <span className="text-xs text-gravel">To</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateInput} />
            </div>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gravel transition hover:bg-black/5 hover:text-ink"
              >
                <X size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-gravel">
                      <Receipt size={22} />
                    </span>
                    <p className="font-medium text-ink">
                      {hasFilter ? 'No expenses match your filters' : 'No expenses yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {hasFilter
                        ? 'Try a different date range or search.'
                        : 'Click “Add Expense” to create the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((e, i) => (
                  <tr key={e.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{fmtDate(e.expense_date)}</td>
                    <td className="px-4 py-3.5">
                      {e.category?.name ? (
                        <span className="inline-block rounded-full bg-signal/20 px-2.5 py-1 text-xs font-semibold text-ink">
                          {e.category.name}
                        </span>
                      ) : (
                        <span className="text-gravel">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{e.vehicle?.plate_number || '-'}</td>
                    <td className="px-4 py-3.5 text-ink">{e.driver?.full_name || '-'}</td>
                    <td className="px-4 py-3.5 text-ink">{e.vendor?.name || '-'}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                      {money(e.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setFilesFor(e)}
                          aria-label="View files"
                          title="View files"
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Paperclip size={17} />
                        </button>
                        <button
                          onClick={() => openEdit(e)}
                          aria-label="Edit expense"
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={17} />
                        </button>
                        {/* only admins can delete */}
                        {admin && (
                          <button
                            onClick={() => setDeleting(e)}
                            aria-label="Delete expense"
                            className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* totals row */}
            {!loading && rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-ink/10 bg-paper/70 text-sm font-semibold text-ink">
                  <td colSpan={6} className="px-4 py-3.5 text-right text-gravel">
                    Total
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit side panel */}
      <Modal
        open={formOpen}
        title={editing ? 'Edit Expense' : 'Add Expense'}
        description={editing ? 'Update the expense details' : 'Enter the expense details below'}
        icon={editing ? <Pencil size={20} /> : <Plus size={20} />}
        tone={editing ? 'info' : 'success'}
        size="lg"
        placement="right"
        onClose={closeForm}
        footer={
          <FormActions
            formId={EXPENSE_FORM_ID}
            saving={saving}
            onCancel={closeForm}
            label={editing ? 'Save changes' : 'Add expense'}
          />
        }
      >
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
        />
      </Modal>

      {/* Files side panel */}
      <Modal
        open={!!filesFor}
        title="Files"
        description={
          filesFor
            ? `${filesFor.category?.name || 'Expense'} · ${fmtDate(filesFor.expense_date)} · ${money(filesFor.amount)}`
            : undefined
        }
        icon={<Paperclip size={20} />}
        tone="default"
        size="md"
        placement="right"
        onClose={closeFiles}
      >
        {filesFor && <AttachmentsPanel key={filesFor.id} expenseId={filesFor.id} admin={admin} />}
      </Modal>

      {/* delete confirmation */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => !deleteBusy && setDeleting(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Delete expense?</h2>
              <p className="mt-1 text-sm text-gravel">
                This expense and all its files will be removed. This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 rounded-xl border border-black/10 py-2.5 font-medium text-ink transition hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleteBusy && <Loader2 size={16} className="animate-spin" />}
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}