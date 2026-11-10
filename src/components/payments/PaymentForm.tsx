'use client'
import { useEffect, useState, FormEvent } from 'react'
import PaymentFiles from '@/components/payments/PaymentFiles'
import { getLedger } from '@/lib/ledgerApi'

export type Payment = {
  id: string
  customer_id: string
  payment_date: string | null
  amount: number
  mode: string | null
  reference: string | null
  notes: string | null
  sale_id?: string | null // set when the money was received with a bill
  customer?: { name: string; phone: string | null } | null
}

export const PAYMENT_FORM_ID = 'payment-form'
export const PAYMENT_MODES = ['cash', 'upi', 'bank', 'cheque', 'other']

type CustomerOpt = { id: string; name: string }

type Props = {
  initial: Payment | null
  customers?: CustomerOpt[]
  saving: boolean
  error?: string | null
  onSubmit: (values: Record<string, unknown>, files: File[]) => void
}

const input =
  'w-full rounded-xl border border-black/10 bg-paper/60 px-3 py-2.5 text-sm outline-none transition focus:border-signal focus:bg-white focus:ring-4 focus:ring-signal/20 disabled:opacity-60'
const label = 'mb-1 block text-xs font-semibold text-gravel'

const inr = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PaymentForm({ initial, customers = [], saving, error, onSubmit }: Props) {
  const [customerId, setCustomerId] = useState(initial?.customer_id ?? '')
  // local date (toISOString is UTC and gives yesterday in India after midnight)
  const [date, setDate] = useState(initial?.payment_date ?? new Date().toLocaleDateString('en-CA'))
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [mode, setMode] = useState(initial?.mode ?? 'cash')
  const [reference, setReference] = useState(initial?.reference ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [pending, setPending] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  const customerList = Array.isArray(customers) ? customers : []

  // a payment taken with a bill follows that bill: customer and date are changed on the bill
  const linked = !!initial?.sale_id

  // show what this customer still owes
  useEffect(() => {
    if (!customerId) { setBalance(null); return }
    let cancelled = false
    getLedger(customerId)
      .then((l) => { if (!cancelled) setBalance(l.closing_balance) })
      .catch(() => { if (!cancelled) setBalance(null) })
    return () => { cancelled = true }
  }, [customerId])

  // balance after this payment (when editing, the saved amount is already in the balance)
  const entered = Number(amount) > 0 ? Number(amount) : 0
  const after = balance == null ? null : balance - (entered - (initial ? Number(initial.amount) || 0 : 0))

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!customerId) return setLocalError('Select a customer')
    if (!(Number(amount) > 0)) return setLocalError('Amount must be more than 0')
    setLocalError(null)
    onSubmit(
      { customer_id: customerId, payment_date: date, amount: Number(amount), mode, reference, notes },
      pending,
    )
  }

  const shownError = localError || error

  return (
    <>
      <form id={PAYMENT_FORM_ID} onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
        {shownError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {shownError}
          </p>
        )}

        {linked && (
          <p className="rounded-xl bg-paper/70 px-3.5 py-2.5 text-xs text-gravel">
            This money was received with a bill. To change the customer or date, edit the bill.
          </p>
        )}

        <div>
          <label className={label}>Customer *</label>
          <select
            className={input}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={saving || linked}
          >
            <option value="">Select customer</option>
            {customerList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {balance !== null && (
            <p className="mt-1.5 text-xs text-gravel">
              {balance > 0 && <>Pending balance: <b className="text-red-600">{inr(balance)}</b></>}
              {balance < 0 && <>Advance paid: <b className="text-green-600">{inr(balance)}</b></>}
              {balance === 0 && <>No pending balance</>}
              {initial && <> (includes this payment)</>}
              {after !== null && entered > 0 && (
                <>
                  {' · '}After this payment:{' '}
                  <b className={after > 0 ? 'text-red-600' : 'text-green-600'}>
                    {inr(after)}{after > 0 ? ' Dr' : after < 0 ? ' Cr' : ''}
                  </b>
                </>
              )}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Payment date</label>
            <input
              type="date" className={input} value={date}
              onChange={(e) => setDate(e.target.value)} disabled={saving || linked}
            />
          </div>
          <div>
            <label className={label}>Amount (₹) *</label>
            <input
              type="number" min="0" step="0.01" inputMode="decimal"
              className={input} value={amount} onChange={(e) => setAmount(e.target.value)} disabled={saving}
            />
          </div>
          <div>
            <label className={label}>Payment method</label>
            <select className={input} value={mode} onChange={(e) => setMode(e.target.value)} disabled={saving}>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Reference / cheque / UTR no.</label>
            <input className={input} value={reference} onChange={(e) => setReference(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea rows={3} className={input} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} />
        </div>
      </form>

      {/* receipts stay outside the <form> so their buttons never submit the payment */}
      <PaymentFiles
        paymentId={initial?.id ?? null}
        pending={pending}
        onPendingChange={setPending}
      />
    </>
  )
}