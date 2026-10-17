'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X,
  ShoppingCart, IndianRupee, Package, CalendarDays,
} from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import Modal from '@/components/ui/Modal'
import PurchaseForm, { Purchase, PURCHASE_FORM_ID } from '@/components/purchases/PurchaseForm'
import { FormActions } from '@/components/ui/formKit'
import { money } from '@/lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-10-18..." -> "18 Oct 2026"
function fmtDate(v: unknown) {
  const s = String(v ?? '').slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return '-'
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`
}

function paymentStyle(p?: string | null) {
  const v = (p || '').toLowerCase()
  if (!v) return 'bg-black/5 text-gravel'
  if (v.includes('paid') && !v.includes('un')) return 'bg-green-100 text-green-800'
  if (v.includes('pend') || v.includes('credit') || v.includes('unpaid') || v.includes('due'))
    return 'bg-amber-100 text-amber-800'
  return 'bg-signal/20 text-ink'
}

const PlusIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
const PencilIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

export default function PurchasesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

  const query = useMemo(() => {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [from, to])

  const r = useResource<Purchase>('/purchases', query)

  // close the delete dialog with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && r.deleting && !r.deleteBusy) r.cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [r.deleting, r.deleteBusy, r.cancelDelete])

  // search runs on the rows already loaded
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return r.rows
    return r.rows.filter((p) =>
      [p.vendor?.name, p.material?.name, p.vehicle?.plate_number, p.payment].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [r.rows, search])

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, p) => ({
          amount: a.amount + (Number(p.total_amount) || 0),
          qty: a.qty + (Number(p.quantity) || 0),
        }),
        { amount: 0, qty: 0 }
      ),
    [rows]
  )

  const hasFilter = !!(from || to || search)
  function clearFilters() {
    setFrom('')
    setTo('')
    setSearch('')
  }

  const dateWrap =
    'flex items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20'
  const dateInput = 'bg-transparent py-2.5 text-sm text-ink outline-none'

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Purchases</h1>
          <p className="mt-1 text-sm text-gravel">Material bought from vendors.</p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Purchase
        </button>
      </div>

      {/* summary cards (they follow the filters below) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <ShoppingCart size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{rows.length}</p>
            <p className="mt-1 text-xs text-gravel">Total purchases</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-signal">
            <IndianRupee size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{money(totals.amount)}</p>
            <p className="mt-1 text-xs text-gravel">Purchase amount</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <Package size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">
              {totals.qty.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-gravel">Total quantity</p>
          </div>
        </div>
      </div>

      {r.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {r.error}
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
              placeholder="Search vendor, material, vehicle"
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
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {r.loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-gravel">
                      <ShoppingCart size={22} />
                    </span>
                    <p className="font-medium text-ink">
                      {hasFilter ? 'No purchases match your filters' : 'No purchases yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {hasFilter
                        ? 'Try a different date range or search.'
                        : 'Click “Add Purchase” to create the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((p, i) => (
                  <tr key={p.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{fmtDate(p.purchase_date)}</td>
                    <td className="px-4 py-3.5 font-medium text-ink">{p.vendor?.name || '-'}</td>
                    <td className="px-4 py-3.5 text-ink">{p.material?.name || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{p.vehicle?.plate_number || '-'}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-ink">{p.quantity}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gravel">{money(p.rate)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                      {money(p.total_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStyle(p.payment)}`}
                      >
                        {p.payment || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => r.openEdit(p)}
                          aria-label="Edit purchase"
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={17} />
                        </button>
                        {/* only admins can delete */}
                        {r.admin && (
                          <button
                            onClick={() => r.askDelete(p)}
                            aria-label="Delete purchase"
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
            {!r.loading && rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-ink/10 bg-paper/70 text-sm font-semibold text-ink">
                  <td colSpan={5} className="px-4 py-3.5 text-right text-gravel">
                    Total
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{totals.qty.toLocaleString('en-IN')}</td>
                  <td />
                  <td className="px-4 py-3.5 text-right tabular-nums">{money(totals.amount)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit side panel */}
      <Modal
        open={r.formOpen}
        title={r.editing ? 'Edit Purchase' : 'Add Purchase'}
        description={r.editing ? 'Update the purchase details' : 'Enter the purchase details below'}
        icon={r.editing ? PencilIcon : PlusIcon}
        tone={r.editing ? 'info' : 'success'}
        size="lg"
        placement="right"
        onClose={r.closeForm}
        footer={
          <FormActions
            formId={PURCHASE_FORM_ID}
            saving={r.saving}
            onCancel={r.closeForm}
            label={r.editing ? 'Save changes' : 'Add purchase'}
          />
        }
      >
        <PurchaseForm
          key={r.editing?.id ?? 'new'}
          initial={r.editing}
          saving={r.saving}
          error={r.formError}
          onSubmit={r.save}
        />
      </Modal>

      {/* delete confirmation */}
      {r.deleting && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => !r.deleteBusy && r.cancelDelete()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Delete purchase?</h2>
              <p className="mt-1 text-sm text-gravel">
                {r.deleting.vendor?.name ? (
                  <>
                    The purchase from <span className="font-medium text-ink">{r.deleting.vendor.name}</span> will be removed.
                  </>
                ) : (
                  'This purchase will be removed.'
                )}{' '}
                This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={r.cancelDelete}
                className="flex-1 rounded-xl border border-black/10 py-2.5 font-medium text-ink transition hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={r.confirmDelete}
                disabled={r.deleteBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {r.deleteBusy && <Loader2 size={16} className="animate-spin" />}
                {r.deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}