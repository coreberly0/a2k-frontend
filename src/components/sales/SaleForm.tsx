'use client'
// components/sales/SaleForm.tsx
import { useEffect, useState, FormEvent, ReactNode } from 'react'
import {
  Hash, CalendarDays, UserRound, Boxes, Truck, Contact, Package, IndianRupee, Percent, Check, CircleAlert,
  Paperclip, Upload, X,
} from 'lucide-react'
import { useOptions } from '@/hooks/useOptions'
import { money, orNull, todayStr } from '@/lib/format'
import { salesBillApi } from '@/lib/billApi'
import { paymentFilesApi, ReceiptFile } from '@/lib/paymentFilesApi'
import { getLedger } from '@/lib/ledgerApi'
import { Field, Dropdown, normalize, fieldBase, inputBase } from '@/components/ui/formKit'
// NOTE: this must match the real filename on disk exactly (Vercel is case-sensitive)
import BillField from '@/components/purchases/Billfield'

export type Sale = {
  id: string
  bill_no: string
  sale_date: string
  customer_id: string | null
  material_id: string | null
  vehicle_id: string | null
  driver_id: string | null
  quantity: number | string
  rate: number | string
  with_gst: boolean
  gst_percent: number | string | null
  payment: string | null
  notes: string | null
  total_amount: number | string
  // filled by the backend from the linked payment
  received_amount?: number | string | null
  received_payment_id?: string | null
  received_mode?: string | null
  received_reference?: string | null
  balance_due?: number | string | null
  bill_name?: string | null
  customer?: { name: string } | null
  material?: { name: string } | null
  vehicle?: { plate_number: string } | null
}

/** What the person did with the SALES BILL COPY in this form (one file). */
export type BillChange = { file: File | null; remove: boolean }

/** What the person did with the PAYMENT RECEIPT files in this form (many files). */
export type ReceiptChange = { files: File[]; removeIds: string[] }

type Props = {
  initial?: Sale | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>, bill: BillChange, receipt: ReceiptChange) => void
}

/** The panel footer buttons submit this form through its id. */
export const SALE_FORM_ID = 'sale-form'

const GST_PRESETS = ['5', '12', '18', '28']
const MODES = ['cash', 'upi', 'bank', 'cheque', 'other']

const RECEIPT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const RECEIPT_MAX_MB = 5
const RECEIPT_MAX_FILES = 10

// no overflow-hidden on the cards, so dropdown lists can open past the card edge
const CARD = 'rounded-2xl border border-black/10 bg-white shadow-sm'

const r2 = (n: number) => Math.round(n * 100) / 100

function formatDate(value: string) {
  if (!value) return '-'
  const [y, m, d] = value.split('-')
  return y && m && d ? `${d}/${m}/${y}` : value
}

/** One label / value line in the summary. */
function Line({
  label, hint, strong, children,
}: { label: string; hint?: string; strong?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className={strong ? 'font-semibold text-ink' : 'text-gravel'}>
        {label}
        {hint && <span className="mt-0.5 block text-xs font-normal text-gravel/70">{hint}</span>}
      </dt>
      <dd className={`tabular-nums ${strong ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{children}</dd>
    </div>
  )
}

/**
 * Payment receipt picker (UPI screenshot / bank slip).
 * Different from the sales bill copy: many files, attached to the money received.
 */
function ReceiptField({
  files, onFilesChange, existing, onRemoveExisting, disabled, error, onError,
}: {
  files: File[]
  onFilesChange: (f: File[]) => void
  existing: ReceiptFile[]
  onRemoveExisting: (id: string) => void
  disabled: boolean
  error: string
  onError: (m: string) => void
}) {
  function add(list: FileList | null) {
    if (!list) return
    const next = [...files]
    for (const f of Array.from(list)) {
      if (!RECEIPT_TYPES.includes(f.type)) { onError('Only PDF, JPG, PNG or WEBP files are allowed'); continue }
      if (f.size > RECEIPT_MAX_MB * 1024 * 1024) { onError(`Each file must be ${RECEIPT_MAX_MB} MB or smaller`); continue }
      if (existing.length + next.length >= RECEIPT_MAX_FILES) { onError(`Up to ${RECEIPT_MAX_FILES} receipt files`); break }
      next.push(f)
    }
    onFilesChange(next)
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-ink">
        Payment receipt <span className="font-normal text-gravel">(optional)</span>
      </span>

      <label
        className={`flex items-center gap-3 rounded-xl border border-dashed border-black/20 bg-white px-4 py-3 text-sm text-gravel transition ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-black/5'
        }`}
      >
        <Upload size={18} className="shrink-0" />
        <span className="min-w-0">
          {disabled ? 'Enter the amount received first' : 'Upload UPI / bank slip'}
          <span className="block text-xs text-gravel/70">PDF, JPG, PNG, max {RECEIPT_MAX_MB} MB each</span>
        </span>
        <input
          type="file"
          multiple
          disabled={disabled}
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { onError(''); add(e.target.files); e.target.value = '' }}
        />
      </label>

      {(existing.length > 0 || files.length > 0) && (
        <ul className="mt-2 space-y-1">
          {existing.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper/70 px-3 py-1.5 text-xs text-ink">
              <a
                href={f.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-1.5 hover:underline"
              >
                <Paperclip size={13} className="shrink-0 text-gravel" />
                <span className="truncate">{f.name}</span>
              </a>
              <button type="button" onClick={() => onRemoveExisting(f.id)} aria-label={`Remove ${f.name}`} className="text-red-600">
                <X size={14} />
              </button>
            </li>
          ))}
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-signal/10 px-3 py-1.5 text-xs text-ink">
              <span className="flex min-w-0 items-center gap-1.5">
                <Paperclip size={13} className="shrink-0 text-gravel" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-gravel">· new</span>
              </span>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
                className="text-red-600"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function SaleForm({ initial, saving, error, onSubmit }: Props) {
  const customers = useOptions('/customers', (r) => r.name)
  const materials = useOptions('/materials', (r) => r.name)
  const vehicles = useOptions('/vehicles', (r) => r.plate_number)
  const drivers = useOptions('/drivers', (r) => r.full_name)

  const [billNo, setBillNo] = useState(initial?.bill_no ?? '')
  const [date, setDate] = useState(initial?.sale_date?.slice(0, 10) ?? todayStr())
  const [customerId, setCustomerId] = useState(initial?.customer_id ?? '')
  const [materialId, setMaterialId] = useState(initial?.material_id ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicle_id ?? '')
  const [driverId, setDriverId] = useState(initial?.driver_id ?? '')
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '')
  const [rate, setRate] = useState(initial ? String(initial.rate) : '')
  const [withGst, setWithGst] = useState(initial?.with_gst ?? false)
  const [gstPercent, setGstPercent] = useState(
    initial?.gst_percent != null ? String(initial.gst_percent) : ''
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errs, setErrs] = useState<{ customer?: string; material?: string; received?: string }>({})

  // money received with this bill
  const initialReceived = Number(initial?.received_amount) || 0
  const [receivedAmount, setReceivedAmount] = useState(initialReceived > 0 ? String(initialReceived) : '')
  const [receivedMode, setReceivedMode] = useState(initial?.received_mode || 'cash')
  const [receivedRef, setReceivedRef] = useState(initial?.received_reference ?? '')

  // customer's balance from the ledger
  const [ledgerBalance, setLedgerBalance] = useState<number | null>(null)

  // 1) sales bill copy (one file, stored on the sale)
  const [billFile, setBillFile] = useState<File | null>(null)
  const [billRemoved, setBillRemoved] = useState(false)
  const [billError, setBillError] = useState('')

  // 2) payment receipt files (many files, stored on the linked payment)
  const [receiptFiles, setReceiptFiles] = useState<File[]>([])
  const [existingReceipts, setExistingReceipts] = useState<ReceiptFile[]>([])
  const [removeReceiptIds, setRemoveReceiptIds] = useState<string[]>([])
  const [receiptError, setReceiptError] = useState('')

  const base = Number(quantity || 0) * Number(rate || 0)
  const gstAmount = withGst ? (base * Number(gstPercent || 0)) / 100 : 0
  const total = r2(base + gstAmount)
  const hasLine = Number(quantity) > 0 && Number(rate) > 0

  const received = Math.max(Number(receivedAmount) || 0, 0)
  const balanceDue = r2(total - received)

  // Ledger closing balance already includes the saved version of this bill and its payment
  // when editing, so take them out to get the balance from BEFORE this bill.
  const savedTotal = Number(initial?.total_amount) || 0
  const sameCustomer = !!initial && initial.customer_id === customerId
  const previous =
    ledgerBalance == null ? null : r2(ledgerBalance - (sameCustomer ? savedTotal - initialReceived : 0))
  const totalDue = previous == null ? null : r2(previous + total)
  const closing = previous == null ? null : r2(previous + total - received)

  useEffect(() => {
    if (!customerId) { setLedgerBalance(null); return }
    let cancelled = false
    getLedger(customerId)
      .then((l: any) => { if (!cancelled) setLedgerBalance(Number(l.closing_balance) || 0) })
      .catch(() => { if (!cancelled) setLedgerBalance(null) })
    return () => { cancelled = true }
  }, [customerId])

  // when editing, load the receipt files already saved on the linked payment
  const paymentId = initial?.received_payment_id ?? null
  useEffect(() => {
    if (!paymentId) { setExistingReceipts([]); return }
    let cancelled = false
    paymentFilesApi
      .list(paymentId)
      .then((list) => { if (!cancelled) setExistingReceipts(list) })
      .catch(() => { if (!cancelled) setExistingReceipts([]) })
    return () => { cancelled = true }
  }, [paymentId])

  function removeExistingReceipt(id: string) {
    setExistingReceipts((list) => list.filter((f) => f.id !== id))
    setRemoveReceiptIds((ids) => [...ids, id])
  }

  async function viewExistingBill() {
    if (!initial) return
    setBillError('')
    try {
      await salesBillApi.open(initial.id)
    } catch (e: any) {
      setBillError(e?.message || 'Could not open the bill')
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // the dropdowns are not native inputs, so check required ones here
    const next: typeof errs = {}
    if (!customerId) next.customer = 'Please select a customer'
    if (!materialId) next.material = 'Please select a material'
    if (received > total) next.received = 'Cannot be more than the bill total. Use Payments for advance money.'
    setErrs(next)
    if (next.customer || next.material || next.received) return

    const body: Record<string, unknown> = {
      bill_no: billNo.trim(),
      sale_date: date,
      customer_id: customerId,
      material_id: materialId,
      vehicle_id: vehicleId || null,
      driver_id: driverId || null,
      quantity: Number(quantity),
      rate: Number(rate),
      with_gst: withGst,
      notes: orNull(notes),
      // the backend sets paid / unpaid from this, so "payment" is no longer sent
      received_amount: received > 0 ? received : '',
    }
    if (received > 0) {
      body.received_mode = receivedMode
      body.received_reference = receivedRef.trim()
    }
    if (withGst && gstPercent !== '') body.gst_percent = Number(gstPercent)

    onSubmit(
      body,
      { file: billFile, remove: billRemoved },
      // no money received = no payment row, so there is nothing to attach receipts to
      { files: received > 0 ? receiptFiles : [], removeIds: removeReceiptIds },
    )
  }

  const shownError = error || billError

  // what is still missing, shown in the summary so nobody has to hunt for it
  const missing = [
    !billNo.trim() && 'Bill no',
    !customerId && 'Customer',
    !materialId && 'Material',
    !(Number(quantity) > 0) && 'Quantity',
    !(Number(rate) > 0) && 'Rate',
  ].filter(Boolean) as string[]

  const status = total > 0 ? (received >= total ? 'paid' : received > 0 ? 'part' : 'unpaid') : null

  const box = `${fieldBase} border-black/10`

  return (
    <form
      id={SALE_FORM_ID}
      onSubmit={handleSubmit}
      className="grid gap-5 text-ink lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
    >
      {shownError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 lg:hidden"
        >
          {shownError}
        </p>
      )}

      {/* ---------- left: every field on one card ---------- */}
      <section className={`${CARD} p-5`}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Bill no" required>
            <div className={box}>
              <Hash size={18} className="shrink-0 text-gravel" />
              <input
                required
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                placeholder="e.g. 1024"
                className={inputBase}
              />
            </div>
          </Field>

          <Field label="Date" required>
            <div className={box}>
              <CalendarDays size={18} className="shrink-0 text-gravel" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputBase}
              />
            </div>
          </Field>

          <Dropdown
            label="Customer"
            icon={UserRound}
            required
            value={customerId}
            onChange={(v) => {
              setCustomerId(v)
              setErrs((x) => ({ ...x, customer: undefined }))
            }}
            options={normalize(customers.options)}
            failed={customers.failed}
            error={errs.customer}
          />

          <Dropdown
            label="Material"
            icon={Boxes}
            required
            value={materialId}
            onChange={(v) => {
              setMaterialId(v)
              setErrs((x) => ({ ...x, material: undefined }))
            }}
            options={normalize(materials.options)}
            failed={materials.failed}
            error={errs.material}
          />

          <Dropdown
            label="Vehicle"
            icon={Truck}
            value={vehicleId}
            onChange={setVehicleId}
            options={normalize(vehicles.options)}
            failed={vehicles.failed}
          />

          <Dropdown
            label="Driver"
            icon={Contact}
            value={driverId}
            onChange={setDriverId}
            options={normalize(drivers.options)}
            failed={drivers.failed}
          />

          <Field label="Quantity" required>
            <div className={box}>
              <Package size={18} className="shrink-0 text-gravel" />
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className={inputBase}
              />
            </div>
          </Field>

          <Field label="Rate" required>
            <div className={box}>
              <IndianRupee size={18} className="shrink-0 text-gravel" />
              <input
                type="number"
                step="any"
                min="0"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className={inputBase}
              />
            </div>
          </Field>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Amount</span>
            <div className={`${fieldBase} border-black/10 bg-paper/70`} aria-live="polite">
              <IndianRupee size={18} className="shrink-0 text-gravel" />
              <span className="py-3 text-sm font-semibold tabular-nums text-ink">{money(base)}</span>
            </div>
          </div>

          {/* GST: one slim bar across the card */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-black/10 bg-paper/60 px-4 py-3 sm:col-span-2 xl:col-span-3">
            <button
              type="button"
              role="switch"
              aria-checked={withGst}
              aria-label="Add GST"
              onClick={() => setWithGst((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${withGst ? 'bg-signal' : 'bg-black/15'}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                  withGst ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <div className="min-w-[150px] flex-1">
              <p className="text-sm font-medium text-ink">Add GST</p>
              <p className="text-xs text-gravel">
                {withGst && gstPercent
                  ? `${gstPercent}% adds ${money(gstAmount)} to this bill.`
                  : 'Charge GST on top of the bill amount.'}
              </p>
            </div>

            {withGst && (
              <div className="flex flex-wrap items-center gap-2">
                {GST_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setGstPercent(p)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      gstPercent === p
                        ? 'border-ink bg-ink text-signal'
                        : 'border-black/10 bg-white text-ink hover:bg-black/5'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <div className={`${fieldBase} w-28 border-black/10 bg-white`}>
                  <Percent size={15} className="shrink-0 text-gravel" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Other"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    className={`${inputBase} py-1.5`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* money received with this bill (+ its payment receipt) */}
          <div className="rounded-xl border border-black/10 bg-paper/60 p-4 sm:col-span-2 xl:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-ink">Money received now</p>
                <p className="text-xs text-gravel">
                  Leave empty if nothing was paid. Whatever is left stays on the customer&apos;s ledger.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!(total > 0)}
                  onClick={() => setReceivedAmount(String(total))}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-black/5 disabled:opacity-50"
                >
                  Full amount
                </button>
                <button
                  type="button"
                  onClick={() => { setReceivedAmount(''); setErrs((x) => ({ ...x, received: undefined })) }}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-black/5"
                >
                  Nothing
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Amount received" optional>
                <div className={`${box} bg-white`}>
                  <IndianRupee size={18} className="shrink-0 text-gravel" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={receivedAmount}
                    onChange={(e) => {
                      setReceivedAmount(e.target.value)
                      setErrs((x) => ({ ...x, received: undefined }))
                    }}
                    placeholder="0.00"
                    className={inputBase}
                  />
                </div>
                {errs.received && <p className="mt-1 text-xs text-red-600">{errs.received}</p>}
              </Field>

              <Field label="Payment method" optional>
                <div className={`${box} bg-white`}>
                  <select
                    value={receivedMode}
                    onChange={(e) => setReceivedMode(e.target.value)}
                    disabled={received <= 0}
                    className={`${inputBase} disabled:opacity-50`}
                  >
                    {MODES.map((m) => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Reference / UTR / cheque no." optional>
                <div className={`${box} bg-white`}>
                  <input
                    value={receivedRef}
                    onChange={(e) => setReceivedRef(e.target.value)}
                    disabled={received <= 0}
                    placeholder="Optional"
                    className={`${inputBase} disabled:opacity-50`}
                  />
                </div>
              </Field>
            </div>

            {/* attachment 2: payment receipt, only when money was received */}
            <div className="mt-4 border-t border-black/5 pt-4">
              <ReceiptField
                files={receiptFiles}
                onFilesChange={setReceiptFiles}
                existing={existingReceipts}
                onRemoveExisting={removeExistingReceipt}
                disabled={received <= 0 || saving}
                error={receiptError}
                onError={setReceiptError}
              />
            </div>
          </div>

          {/* attachment 1: sales bill copy, and notes side by side */}
          <div className="sm:col-span-2 xl:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gravel">
                  Sales bill copy
                </span>
                <BillField
                  file={billFile}
                  onFileChange={setBillFile}
                  existingName={initial?.bill_name}
                  onViewExisting={viewExistingBill}
                  onRemoveExisting={() => setBillRemoved(true)}
                  removed={billRemoved}
                  disabled={saving}
                />
              </div>

              <Field label="Notes" optional>
                <div className={`${fieldBase} items-start border-black/10`}>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything to remember about this bill"
                    className={`${inputBase} resize-none`}
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- right: summary, balance and what is missing ---------- */}
      <aside className={`${CARD} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Bill summary</h3>
            <p className="mt-0.5 text-xs text-gravel">
              {billNo.trim() ? `Bill ${billNo.trim()}` : 'No bill number yet'} · {formatDate(date)}
            </p>
          </div>
          {status && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {status === 'paid' ? 'Paid' : status === 'part' ? 'Part paid' : 'Unpaid'}
            </span>
          )}
        </div>

        <dl className="mt-4 space-y-2.5 border-t border-black/5 pt-4">
          <Line label="Subtotal" hint={hasLine ? `${quantity} × ${money(Number(rate))}` : undefined}>
            {money(base)}
          </Line>
          <Line label={withGst ? `GST${gstPercent ? ` (${gstPercent}%)` : ''}` : 'GST'}>
            {withGst ? money(gstAmount) : <span className="text-gravel/70">Not added</span>}
          </Line>
        </dl>

        <div className="mt-4 rounded-xl bg-ink px-4 py-4">
          <p className="text-xs text-gravel">This bill</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-signal">{money(total)}</p>
        </div>

        {/* running balance for this customer */}
        <dl className="mt-4 space-y-2.5">
          {customerId && (
            <Line
              label="Previous balance"
              hint={previous != null && previous < 0 ? 'Customer paid in advance' : 'Unpaid from earlier bills'}
            >
              {previous == null ? '…' : money(Math.abs(previous)) + (previous < 0 ? ' Cr' : '')}
            </Line>
          )}
          {customerId && totalDue != null && (
            <Line label="Total to pay">{money(Math.abs(totalDue)) + (totalDue < 0 ? ' Cr' : '')}</Line>
          )}
          <Line label="Received now">
            <span className="text-green-700">{money(received)}</span>
          </Line>
          <div className="border-t border-black/5 pt-2.5">
            <Line label="Balance after this bill" strong>
              <span className={(closing ?? balanceDue) > 0 ? 'text-red-600' : 'text-green-700'}>
                {money(Math.abs(closing ?? balanceDue))}
                {(closing ?? balanceDue) > 0 ? ' Dr' : (closing ?? balanceDue) < 0 ? ' Cr' : ''}
              </span>
            </Line>
          </div>
        </dl>
        <p className="mt-2 text-xs text-gravel">
          The balance goes to the Ledger, and the next bill for this customer starts from it.
        </p>

        {shownError && (
          <p
            role="alert"
            className="mt-4 hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 lg:block"
          >
            {shownError}
          </p>
        )}

        {/* ready / still needed */}
        {missing.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">
            <Check size={16} strokeWidth={3} className="shrink-0" /> Ready to save
          </p>
        ) : (
          <div className="mt-4 rounded-xl bg-paper/70 px-3 py-2.5">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <CircleAlert size={16} className="shrink-0 text-amber-600" />
              {5 - missing.length} of 5 required fields done
            </p>
            <p className="mt-1 text-xs text-gravel">Still needed: {missing.join(', ')}</p>
          </div>
        )}
      </aside>
    </form>
  )
}

/** Footer buttons for the add/edit panels. Submits the form above by its id. */
export function SaleFormActions({
  saving,
  onCancel,
  label = 'Save sale',
}: {
  saving: boolean
  onCancel: () => void
  label?: string
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-black/5 disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={SALE_FORM_ID}
        disabled={saving}
        className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-signal transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}