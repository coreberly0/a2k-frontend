'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X,
  Receipt, CalendarDays, Paperclip, Printer, Truck,
} from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import FullPanel from '@/components/ui/FullPanel'
import SaleForm, { Sale, BillChange, ReceiptChange, SALE_FORM_ID } from '@/components/sales/SaleForm'
import { FormActions } from '@/components/ui/formKit'
import { money } from '@/lib/format'
import { salesBillApi } from '@/lib/billApi'
import { printSale } from '@/lib/printBill'
import { paymentFilesApi } from '@/lib/paymentFilesApi'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-10-18..." -> "18 Oct 2026"
function fmtDate(v: unknown) {
  const s = String(v ?? '').slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return '-'
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`
}

type Status = 'paid' | 'part paid' | 'unpaid'

function statusOf(s: Sale): Status {
  const received = Number(s.received_amount) || 0
  const total = Number(s.total_amount) || 0
  if (total > 0 && received >= total) return 'paid'
  if (received > 0) return 'part paid'
  return 'unpaid'
}

const STATUS_STYLE: Record<Status, { pill: string; bar: string; dot: string }> = {
  paid: { pill: 'bg-green-100 text-green-800', bar: 'bg-green-500', dot: 'bg-green-500' },
  'part paid': { pill: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  unpaid: { pill: 'bg-red-100 text-red-700', bar: 'bg-red-400', dot: 'bg-red-500' },
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

const PAYMENT_FILTERS = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Not fully paid' },
]

export default function SalesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [payment, setPayment] = useState('')
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState('')

  // date filters go to the server; paid / not fully paid runs here (part-paid counts as not fully paid)
  const query = useMemo(() => {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [from, to])

  const r = useResource<Sale>('/sales', query)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && r.deleting && !r.deleteBusy) r.cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [r.deleting, r.deleteBusy, r.cancelDelete])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return r.rows.filter((s) => {
      if (payment === 'paid' && statusOf(s) !== 'paid') return false
      if (payment === 'unpaid' && statusOf(s) === 'paid') return false
      if (!q) return true
      return [s.bill_no, s.customer?.name, s.material?.name, s.vehicle?.plate_number, s.notes].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    })
  }, [r.rows, search, payment])

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, s) => ({
          amount: a.amount + (Number(s.total_amount) || 0),
          qty: a.qty + (Number(s.quantity) || 0),
          received: a.received + (Number(s.received_amount) || 0),
          due: a.due + (Number(s.balance_due) || 0),
        }),
        { amount: 0, qty: 0, received: 0, due: 0 }
      ),
    [rows]
  )

  const hasFilter = !!(from || to || payment || search)
  function clearFilters() {
    setFrom(''); setTo(''); setPayment(''); setSearch('')
  }

  function handleSave(values: Record<string, unknown>, bill: BillChange, receipt: ReceiptChange) {
    return r.save(values, async (saved: Sale) => {
      // 1) sales bill copy -> /sales/:id/bill
      if (bill.file) await salesBillApi.upload(saved.id, bill.file)
      else if (bill.remove) await salesBillApi.remove(saved.id)

      // 2) payment receipt -> /payments/:paymentId/files
      // received_payment_id is null when no money was received, so there is nothing to attach to
      const paymentId = saved.received_payment_id
      if (paymentId) {
        for (const fileId of receipt.removeIds) await paymentFilesApi.remove(paymentId, fileId)
        if (receipt.files.length) await paymentFilesApi.upload(paymentId, receipt.files)
      }
    })
  }

  async function viewBill(id: string) {
    setActionError('')
    try { await salesBillApi.open(id) } catch (e: any) { setActionError(e?.message || 'Could not open the bill') }
  }

  async function printBill(id: string) {
    setActionError('')
    try { await printSale(id) } catch (e: any) { setActionError(e?.message || 'Could not print the bill') }
  }

  const dateWrap =
    'flex items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20'
  const dateInput = 'bg-transparent py-2 text-sm text-ink outline-none'
  const iconBtn = 'rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink'

  const stats = [
    { label: 'Bills', value: String(rows.length), tone: 'text-ink' },
    { label: 'Sales amount', value: money(totals.amount), tone: 'text-ink' },
    { label: 'Received', value: money(totals.received), tone: 'text-green-700' },
    { label: 'Still to collect', value: money(totals.due), tone: totals.due > 0 ? 'text-red-600' : 'text-ink' },
  ]

  /** row actions, shared by the table and the mobile cards */
  const Actions = ({ s }: { s: Sale }) => (
    <div className="flex items-center justify-end gap-0.5">
      {s.bill_name && (
        <button onClick={() => viewBill(s.id)} title={`Bill copy: ${s.bill_name}`} aria-label="View bill copy" className={iconBtn}>
          <Paperclip size={17} />
        </button>
      )}
      <button onClick={() => printBill(s.id)} title="Print bill" aria-label={`Print bill ${s.bill_no}`} className={iconBtn}>
        <Printer size={17} />
      </button>
      <button onClick={() => r.openEdit(s)} title="Edit" aria-label={`Edit bill ${s.bill_no}`} className={iconBtn}>
        <Pencil size={17} />
      </button>
      {r.admin && (
        <button
          onClick={() => r.askDelete(s)}
          title="Delete"
          aria-label={`Delete bill ${s.bill_no}`}
          className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={17} />
        </button>
      )}
    </div>
  )

  /** paid-share bar: how much of the bill has been collected */
  const PaidBar = ({ s }: { s: Sale }) => {
    const total = Number(s.total_amount) || 0
    const pct = total > 0 ? Math.min(100, Math.round(((Number(s.received_amount) || 0) / total) * 100)) : 0
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10" aria-hidden>
        <div className={`h-full rounded-full ${STATUS_STYLE[statusOf(s)].bar}`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Sales</h1>
          <p className="mt-1 text-sm text-gravel">Bills raised to customers and what has been collected on each.</p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Bill
        </button>
      </div>

      {/* one summary strip instead of four boxes; follows the filters */}
      <div className="grid grid-cols-2 divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white sm:grid-cols-4 sm:divide-x">
        {stats.map((c, i) => (
          <div key={c.label} className={`px-5 py-4 ${i > 1 ? 'border-t border-black/5 sm:border-t-0' : ''}`}>
            <p className="text-xs text-gravel">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold leading-none tabular-nums ${c.tone}`}>{c.value}</p>
            {i === 1 && (
              <p className="mt-1.5 text-xs text-gravel">{totals.qty.toLocaleString('en-IN')} total quantity</p>
            )}
          </div>
        ))}
      </div>

      {(r.error || actionError) && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {r.error || actionError}
        </p>
      )}

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

          <div className="flex gap-1 rounded-xl border border-black/10 bg-paper/60 p-1">
            {PAYMENT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setPayment(f.value)}
                aria-pressed={payment === f.value}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  payment === f.value ? 'bg-ink text-signal shadow' : 'text-gravel hover:bg-black/5 hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <div className={dateWrap}>
              <CalendarDays size={17} className="shrink-0 text-gravel" />
              <input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
            </div>
            <span className="text-gravel">–</span>
            <div className={dateWrap}>
              <CalendarDays size={17} className="shrink-0 text-gravel" />
              <input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateInput} />
            </div>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gravel transition hover:bg-black/5 hover:text-ink"
              >
                <X size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* loading / empty */}
        {r.loading ? (
          <div className="px-4 py-16 text-center text-gravel">
            <Loader2 className="mx-auto animate-spin" size={22} />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-gravel">
              <Receipt size={22} />
            </span>
            <p className="font-medium text-ink">{hasFilter ? 'No bills match your filters' : 'No bills yet'}</p>
            <p className="mt-1 text-sm text-gravel">
              {hasFilter ? 'Try a different date range or search.' : 'Click “Add Bill” to create the first one.'}
            </p>
          </div>
        ) : (
          <>
            {/* ---------- desktop table: 7 columns, no sideways scrolling ---------- */}
            <table className="hidden w-full table-fixed text-left text-sm md:table">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[24%]" />
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-paper/70 text-xs font-semibold text-gravel">
                <tr>
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3 text-right">Quantity × rate</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.map((s) => {
                  const st = statusOf(s)
                  const due = Number(s.balance_due) || 0
                  const got = Number(s.received_amount) || 0
                  return (
                    <tr key={s.id} className="align-top transition hover:bg-paper/50">
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-md bg-ink px-2 py-1 text-xs font-semibold text-signal">
                          {s.bill_no}
                        </span>
                        <p className="mt-1.5 whitespace-nowrap text-xs text-gravel">{fmtDate(s.sale_date)}</p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium leading-snug text-ink">{s.customer?.name || '-'}</p>
                        {s.notes && (
                          <p className="mt-0.5 truncate text-xs text-gravel" title={s.notes}>{s.notes}</p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-ink">{s.material?.name || '-'}</p>
                        {s.vehicle?.plate_number && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gravel">
                            <Truck size={12} className="shrink-0" /> {s.vehicle.plate_number}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums">
                        <p className="font-medium text-ink">{s.quantity}</p>
                        <p className="mt-0.5 text-xs text-gravel">× {money(s.rate)}</p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[st].pill}`}>
                              {st}
                            </span>
                            {s.received_mode && got > 0 && (
                              <span className="text-[11px] uppercase text-gravel">{s.received_mode}</span>
                            )}
                          </div>
                          <PaidBar s={s} />
                          <p className="text-xs tabular-nums text-gravel">
                            {got > 0 && <span className="text-green-700">{money(got)} paid</span>}
                            {got > 0 && due > 0 && ' · '}
                            {due > 0 && <span className="font-medium text-red-600">{money(due)} due</span>}
                            {got === 0 && due === 0 && '-'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right text-base font-bold tabular-nums text-ink">
                        {money(s.total_amount)}
                      </td>

                      <td className="px-2 py-3">
                        <Actions s={s} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink/10 bg-paper/70 text-sm font-semibold text-ink">
                  <td colSpan={3} className="px-4 py-3.5 text-gravel">
                    {rows.length} {rows.length === 1 ? 'bill' : 'bills'}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{totals.qty.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-xs font-medium tabular-nums">
                    <span className="text-green-700">{money(totals.received)} paid</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-base tabular-nums">{money(totals.amount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            {/* ---------- mobile: one card per bill ---------- */}
            <ul className="divide-y divide-black/5 md:hidden">
              {rows.map((s) => {
                const st = statusOf(s)
                const due = Number(s.balance_due) || 0
                const got = Number(s.received_amount) || 0
                return (
                  <li key={s.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-ink px-2 py-1 text-xs font-semibold text-signal">{s.bill_no}</span>
                          <span className="text-xs text-gravel">{fmtDate(s.sale_date)}</span>
                        </div>
                        <p className="mt-2 font-medium text-ink">{s.customer?.name || '-'}</p>
                        <p className="text-xs text-gravel">
                          {[s.material?.name, s.vehicle?.plate_number].filter(Boolean).join(' · ') || '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums text-ink">{money(s.total_amount)}</p>
                        <p className="text-xs tabular-nums text-gravel">{s.quantity} × {money(s.rate)}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[st].pill}`}>{st}</span>
                        <span className="text-xs tabular-nums text-gravel">
                          {got > 0 && <span className="text-green-700">{money(got)} paid</span>}
                          {got > 0 && due > 0 && ' · '}
                          {due > 0 && <span className="font-medium text-red-600">{money(due)} due</span>}
                        </span>
                      </div>
                      <PaidBar s={s} />
                    </div>

                    <Actions s={s} />
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Add / Edit full-width panel */}
      <FullPanel
        open={r.formOpen}
        title={r.editing ? 'Edit Bill' : 'Add Bill'}
        description={r.editing ? `Update bill ${r.editing.bill_no}` : 'Enter the sale details below'}
        icon={r.editing ? PencilIcon : PlusIcon}
        tone={r.editing ? 'info' : 'success'}
        onClose={r.closeForm}
        footer={
          <FormActions
            formId={SALE_FORM_ID}
            saving={r.saving}
            onCancel={r.closeForm}
            label={r.editing ? 'Save changes' : 'Add bill'}
          />
        }
      >
        <SaleForm
          key={r.editing?.id ?? 'new'}
          initial={r.editing}
          saving={r.saving}
          error={r.formError}
          onSubmit={handleSave}
        />
      </FullPanel>

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
                Bill <span className="font-medium text-ink">{r.deleting.bill_no}</span> will be removed.{' '}
                {Number(r.deleting.received_amount) > 0 && 'The money received and its receipt files will be removed too. '}
                {r.deleting.bill_name && 'Its bill copy will be deleted too. '}
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