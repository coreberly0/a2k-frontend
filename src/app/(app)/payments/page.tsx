'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X, IndianRupee, BookOpen } from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import Modal from '@/components/ui/Modal'
import { FormActions } from '@/components/ui/formKit'
import PaymentForm, { Payment, PAYMENT_FORM_ID } from '@/components/payments/PaymentForm'
import { uploadPaymentFiles } from '@/lib/paymentFilesApi'

type Customer = { id: string; name: string }

const inr = (n: number) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const dmy = (d: string | null) => (d ? d.split('-').reverse().join('-') : '-')

export default function PaymentsPage() {
  const r = useResource<Payment>('/payments')
  const customers = useResource<Customer>('/customers')

  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [source, setSource] = useState<'' | 'bill' | 'later'>('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && r.deleting && !r.deleteBusy) r.cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [r.deleting, r.deleteBusy, r.cancelDelete])

  const allRows = r.rows ?? []

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allRows.filter((p) => {
      if (from && (p.payment_date || '') < from) return false
      if (to && (p.payment_date || '') > to) return false
      if (customerFilter && p.customer_id !== customerFilter) return false
      if (source === 'bill' && !p.sale_id) return false
      if (source === 'later' && p.sale_id) return false
      if (!q) return true
      return [p.customer?.name, p.reference, p.mode, p.notes].some((v) => v?.toLowerCase().includes(q))
    })
  }, [allRows, search, from, to, customerFilter, source])

  const total = rows.reduce((s, p) => s + Number(p.amount || 0), 0)
  const filtered = search || from || to || customerFilter || source

  // Save the payment, then upload any receipts chosen in Add mode.
  // ASSUMPTION: r.save() returns the saved row (with id). If it doesn't,
  // the user is told to attach receipts from Edit.
  async function handleSave(values: Record<string, unknown>, files: File[] = []) {
    const saved: any = await (r.save as any)(values)
    if (files.length === 0 || r.editing) return
    const id = saved?.id
    if (!id) {
      window.alert('Payment saved, but receipts were not uploaded. Open Edit and add them there.')
      return
    }
    try {
      await uploadPaymentFiles(id, files)
    } catch {
      window.alert('Payment saved, but receipts failed to upload. Open Edit and try again.')
    }
  }

  const SOURCES = [
    { value: '', label: 'All' },
    { value: 'bill', label: 'With bill' },
    { value: 'later', label: 'Later payments' },
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Payments</h1>
          <p className="mt-1 text-sm text-gravel">
            Money received from customers, at the time of the bill or later.
          </p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Payment
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <IndianRupee size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{inr(total)}</p>
            <p className="mt-1 text-xs text-gravel">Total received{filtered ? ' (filtered)' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{rows.length}</p>
            <p className="mt-1 text-xs text-gravel">Payments</p>
          </div>
        </div>
      </div>

      {r.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {r.error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20 sm:max-w-sm">
            <Search size={18} className="shrink-0 text-gravel" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, reference or method"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
          </div>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            aria-label="Filter by customer"
            className="rounded-xl border border-black/10 bg-paper/60 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">All customers</option>
            {(customers.rows ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex gap-1 rounded-xl border border-black/10 bg-paper/60 p-1">
            {SOURCES.map((f) => (
              <button
                key={f.value}
                onClick={() => setSource(f.value)}
                aria-pressed={source === f.value}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  source === f.value ? 'bg-ink text-signal shadow' : 'text-gravel hover:bg-black/5 hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-black/10 bg-paper/60 px-3 py-2.5 text-sm outline-none" aria-label="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-black/10 bg-paper/60 px-3 py-2.5 text-sm outline-none" aria-label="To date" />
          {filtered && (
            <button
              onClick={() => { setSearch(''); setFrom(''); setTo(''); setCustomerFilter(''); setSource('') }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gravel transition hover:bg-black/5 hover:text-ink"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {r.loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <p className="font-medium text-ink">
                      {filtered ? 'No payments match your filters' : 'No payments yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {filtered ? 'Try different dates, customer or search.' : 'Click “Add Payment” to record the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((p, i) => (
                  <tr key={p.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{dmy(p.payment_date)}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-ink">{p.customer?.name || '-'}</p>
                      {p.customer?.phone && <p className="text-xs text-gravel">{p.customer.phone}</p>}
                    </td>
                    <td className="px-4 py-3.5 uppercase text-gravel">{p.mode || '-'}</td>
                    <td className="px-4 py-3.5 text-gravel">{p.reference || '-'}</td>
                    <td className="px-4 py-3.5">
                      {p.sale_id ? (
                        <span className="rounded-full bg-signal/20 px-2.5 py-1 text-xs font-semibold text-ink">
                          With bill
                        </span>
                      ) : (
                        <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-gravel">
                          Later
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">{inr(p.amount)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/customers/${p.customer_id}/statement`}
                          aria-label="Customer statement"
                          title="Customer statement"
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <BookOpen size={17} />
                        </Link>
                        <button
                          onClick={() => r.openEdit(p)}
                          aria-label="Edit payment"
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={17} />
                        </button>
                        {/* bill payments are removed by editing the bill, so no delete here */}
                        {r.admin && !p.sale_id && (
                          <button
                            onClick={() => r.askDelete(p)}
                            aria-label="Delete payment"
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
          </table>
        </div>
      </div>

      <Modal
        open={r.formOpen}
        title={r.editing ? 'Edit Payment' : 'Add Payment'}
        description={r.editing ? 'Update the payment details' : 'Enter the payment details below'}
        icon={r.editing ? <Pencil size={20} /> : <Plus size={20} />}
        tone={r.editing ? 'info' : 'success'}
        size="xl"
        placement="full"
        onClose={r.closeForm}
        footer={
          <FormActions
            formId={PAYMENT_FORM_ID}
            saving={r.saving}
            onCancel={r.closeForm}
            label={r.editing ? 'Save changes' : 'Add payment'}
          />
        }
      >
        <PaymentForm
          key={r.editing?.id ?? 'new'}
          initial={r.editing}
          customers={customers.rows ?? []}
          saving={r.saving}
          error={r.formError}
          onSubmit={handleSave}
        />
      </Modal>

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
              <h2 className="font-display text-xl font-bold text-ink">Delete payment?</h2>
              <p className="mt-1 text-sm text-gravel">
                <span className="font-medium text-ink">{inr(r.deleting.amount)}</span> from{' '}
                {r.deleting.customer?.name || 'this customer'} will be removed. This can&apos;t be undone.
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