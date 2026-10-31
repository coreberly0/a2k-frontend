'use client'
// components/sales/SaleForm.tsx
import { useState, FormEvent, ReactNode } from 'react'
import {
  Hash, CalendarDays, UserRound, Boxes, Truck, Contact, Package, IndianRupee, Percent, Check, CircleAlert,
} from 'lucide-react'
import { useOptions } from '@/hooks/useOptions'
import { money, orNull, todayStr } from '@/lib/format'
import { salesBillApi } from '@/lib/billApi'
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
  bill_name?: string | null
  customer?: { name: string } | null
  material?: { name: string } | null
  vehicle?: { plate_number: string } | null
}

/** What the person did with the bill copy in this form. */
export type BillChange = { file: File | null; remove: boolean }

type Props = {
  initial?: Sale | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>, bill: BillChange) => void
}

/** The panel footer buttons submit this form through its id. */
export const SALE_FORM_ID = 'sale-form'

const GST_PRESETS = ['5', '12', '18', '28']

// no overflow-hidden on the cards, so dropdown lists can open past the card edge
const CARD = 'rounded-2xl border border-black/10 bg-white shadow-sm'

function formatDate(value: string) {
  if (!value) return '-'
  const [y, m, d] = value.split('-')
  return y && m && d ? `${d}/${m}/${y}` : value
}

/** One label / value line in the summary. */
function Line({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-gravel">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-gravel/70">{hint}</span>}
      </dt>
      <dd className="font-medium tabular-nums text-ink">{children}</dd>
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
  const [payment, setPayment] = useState(initial?.payment ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errs, setErrs] = useState<{ customer?: string; material?: string }>({})

  // bill copy
  const [billFile, setBillFile] = useState<File | null>(null)
  const [billRemoved, setBillRemoved] = useState(false)
  const [billError, setBillError] = useState('')

  const base = Number(quantity || 0) * Number(rate || 0)
  const gstAmount = withGst ? (base * Number(gstPercent || 0)) / 100 : 0
  const total = base + gstAmount
  const hasLine = Number(quantity) > 0 && Number(rate) > 0

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
    setErrs(next)
    if (next.customer || next.material) return

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
    }
    if (withGst && gstPercent !== '') body.gst_percent = Number(gstPercent)
    if (payment) body.payment = payment
    onSubmit(body, { file: billFile, remove: billRemoved })
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

          {/* bill copy and notes side by side */}
          <div className="sm:col-span-2 xl:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <BillField
                file={billFile}
                onFileChange={setBillFile}
                existingName={initial?.bill_name}
                onViewExisting={viewExistingBill}
                onRemoveExisting={() => setBillRemoved(true)}
                removed={billRemoved}
                disabled={saving}
              />

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

      {/* ---------- right: summary, payment and what is missing (no inner scrolling) ---------- */}
      <aside className={`${CARD} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Bill summary</h3>
            <p className="mt-0.5 text-xs text-gravel">
              {billNo.trim() ? `Bill ${billNo.trim()}` : 'No bill number yet'} · {formatDate(date)}
            </p>
          </div>
          {payment && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                payment === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {payment === 'paid' ? 'Paid' : 'Unpaid'}
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
          <p className="text-xs text-gravel">Total amount</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-signal">{money(total)}</p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-ink">
            Payment <span className="font-normal text-gravel">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-black/10 bg-paper/60 p-1">
            {[
              { v: 'paid', label: 'Paid', on: 'bg-green-600 text-white' },
              { v: 'unpaid', label: 'Unpaid', on: 'bg-amber-500 text-white' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={payment === o.v}
                // click again to clear, since payment is optional
                onClick={() => setPayment(payment === o.v ? '' : o.v)}
                className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                  payment === o.v ? `${o.on} shadow-sm` : 'text-gravel hover:bg-black/5 hover:text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

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

/** Footer buttons for the add/edit panels. Submits the form above by its id.
 *  The sales page uses FormActions from formKit instead, so this is only needed
 *  while add.tsx / edit.tsx still exist. */
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