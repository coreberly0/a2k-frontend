'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X,
  Receipt, IndianRupee, Package, CalendarDays,
} from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import { Sale } from '@/components/sales/SaleForm'
import { money } from '@/lib/format'
import AddSale from './add'
import EditSale from './edit'

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

export default function SalesPage() {
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

  const r = useResource<Sale>('/sales', query)

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
    return r.rows.filter((s) =>
      [s.bill_no, s.customer?.name, s.material?.name, s.vehicle?.plate_number, s.payment].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [r.rows, search])

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, s) => ({
          amount: a.amount + (Number(s.total_amount) || 0),
          qty: a.qty + (Number(s.quantity) || 0),
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
          <h1 className="font-display text-3xl font-bold text-ink">Sales</h1>
          <p className="mt-1 text-sm text-gravel">All bills raised to customers.</p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Bill
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
            <p className="mt-1 text-xs text-gravel">Total bills</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-signal">
            <IndianRupee size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{money(totals.amount)}</p>
            <p className="mt-1 text-xs text-gravel">Sales amount</p>
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
              placeholder="Search bill, customer, vehicle"
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
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Bill No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
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
                  <td colSpan={11} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-gravel">
                      <Receipt size={22} />
                    </span>
                    <p className="font-medium text-ink">
                      {hasFilter ? 'No bills match your filters' : 'No bills yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {hasFilter ? 'Try a different date range or search.' : 'Click “Add Bill” to create the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((s, i) => (
                  <tr key={s.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-ink px-2 py-1 text-xs font-semibold text-signal">
                        {s.bill_no}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{fmtDate(s.sale_date)}</td>
                    <td className="px-4 py-3.5 font-medium text-ink">{s.customer?.name || '-'}</td>
                    <td className="px-4 py-3.5 text-ink">{s.material?.name || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{s.vehicle?.plate_number || '-'}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-ink">{s.quantity}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gravel">{money(s.rate)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                      {money(s.total_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStyle(s.payment)}`}
                      >
                        {s.payment || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => r.openEdit(s)}
                          aria-label={`Edit bill ${s.bill_no}`}
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => r.askDelete(s)}
                          aria-label={`Delete bill ${s.bill_no}`}
                          className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
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
                  <td colSpan={6} className="px-4 py-3.5 text-right text-gravel">
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

      {/* Add popup: open when the form is open and nothing is being edited */}
      <AddSale
        open={r.formOpen && !r.editing}
        saving={r.saving}
        error={r.formError}
        onSubmit={r.save}
        onClose={r.closeForm}
      />

      {/* Edit popup: open when the form is open and a bill is selected */}
      <EditSale
        open={r.formOpen && !!r.editing}
        sale={r.editing}
        saving={r.saving}
        error={r.formError}
        onSubmit={r.save}
        onClose={r.closeForm}
      />

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
              <h2 className="font-display text-xl font-bold text-ink">Delete bill?</h2>
              <p className="mt-1 text-sm text-gravel">
                Bill <span className="font-medium text-ink">{r.deleting.bill_no}</span> will be removed.
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
                {r.deleteBusy ? 'Deleting…' : 'Delete bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}