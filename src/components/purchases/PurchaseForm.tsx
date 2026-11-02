'use client'
// components/purchases/PurchaseForm.tsx
import { useState, useEffect, useRef, FormEvent } from 'react'
import { CalendarDays, Store, Boxes, Truck, Package, IndianRupee, StickyNote, Check, CircleAlert } from 'lucide-react'
import { useOptions } from '@/hooks/useOptions'
import { money, todayStr } from '@/lib/format'
import { Field, Dropdown, normalize, fieldBase, inputBase } from '@/components/ui/formKit'
import BillField from '@/components/purchases/Billfield'
import { openBill } from '@/lib/billApi'

export type Purchase = {
  id: string
  purchase_date: string
  vendor_id: string | null
  material_id: string | null
  vehicle_id: string | null
  quantity: number | string
  rate: number | string
  payment: string | null
  total_amount: number | string
  notes?: string | null
  bill_name?: string | null
  vendor?: { name: string } | null
  material?: { name: string } | null
  vehicle?: { plate_number: string } | null
}

/** What the user did with the bill copy in this form. */
export type BillChange = { file: File | null; remove: boolean }

type Props = {
  initial?: Purchase | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>, bill: BillChange) => void
}

/** The panel footer buttons submit this form through its id. */
export const PURCHASE_FORM_ID = 'purchase-form'

// no overflow-hidden on the cards, so dropdown lists can open past the card edge
const CARD = 'rounded-2xl border border-black/10 bg-white shadow-sm'

/** Width of the form itself, so the layout fits a narrow or a wide side panel (not just the screen). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1200)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(el.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function formatDate(value: string) {
  if (!value) return '-'
  const [y, m, d] = value.split('-')
  return y && m && d ? `${d}/${m}/${y}` : value
}

export default function PurchaseForm({ initial, saving, error, onSubmit }: Props) {
  const vendors = useOptions('/vendors', (r) => r.name)
  const materials = useOptions('/materials', (r) => r.name)
  const vehicles = useOptions('/vehicles', (r) => r.plate_number)

  const [date, setDate] = useState(initial?.purchase_date?.slice(0, 10) ?? todayStr())
  const [vendorId, setVendorId] = useState(initial?.vendor_id ?? '')
  const [materialId, setMaterialId] = useState(initial?.material_id ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicle_id ?? '')
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '')
  const [rate, setRate] = useState(initial ? String(initial.rate) : '')
  const [payment, setPayment] = useState(initial?.payment ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [billFile, setBillFile] = useState<File | null>(null)
  const [billRemoved, setBillRemoved] = useState(false)
  const [viewError, setViewError] = useState('')
  const [errs, setErrs] = useState<{ vendor?: string; material?: string }>({})

  // layout follows the form's own width: side summary + 3 / 2 / 1 columns
  const [formRef, W] = useWidth<HTMLFormElement>()
  const side = W >= 760
  const asideW = W >= 1100 ? 340 : 280
  const leftW = side ? W - asideW - 20 : W
  const cols = leftW >= 800 ? 3 : leftW >= 440 ? 2 : 1
  const full = { gridColumn: '1 / -1' } as const

  const total = Number(quantity || 0) * Number(rate || 0)
  const hasLine = Number(quantity) > 0 && Number(rate) > 0

  async function viewBill() {
    if (!initial) return
    setViewError('')
    try {
      await openBill(initial.id)
    } catch (e: any) {
      setViewError(e?.message || 'Could not open the bill')
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // the dropdowns are not native inputs, so check required ones here
    const next: typeof errs = {}
    if (!vendorId) next.vendor = 'Please select a vendor'
    if (!materialId) next.material = 'Please select a material'
    setErrs(next)
    if (next.vendor || next.material) return

    const body: Record<string, unknown> = {
      purchase_date: date,
      vendor_id: vendorId,
      material_id: materialId,
      vehicle_id: vehicleId || null,
      quantity: Number(quantity),
      rate: Number(rate),
      notes: notes.trim() || null, // always sent, so clearing the box clears the note
    }
    if (payment) body.payment = payment
    onSubmit(body, { file: billFile, remove: billRemoved && !billFile })
  }

  const shownError = error || viewError

  // what is still missing, shown in the summary so nobody has to hunt for it
  const missing = [
    !vendorId && 'Vendor',
    !materialId && 'Material',
    !(Number(quantity) > 0) && 'Quantity',
    !(Number(rate) > 0) && 'Rate',
  ].filter(Boolean) as string[]

  const box = `${fieldBase} border-black/10`

  return (
    <form
      ref={formRef}
      id={PURCHASE_FORM_ID}
      onSubmit={handleSubmit}
      className="grid items-start gap-5 text-ink"
      style={{ gridTemplateColumns: side ? `minmax(0, 1fr) ${asideW}px` : 'minmax(0, 1fr)' }}
    >
      {shownError && !side && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {shownError}
        </p>
      )}

      {/* ---------- left: every field on one card ---------- */}
      <section className={`${CARD} p-5`}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          <Field label="Date" required>
            <div className={box}>
              <CalendarDays size={18} className="shrink-0 text-gravel" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputBase} min-w-0`}
              />
            </div>
          </Field>

          <Dropdown
            label="Vendor"
            icon={Store}
            required
            value={vendorId}
            onChange={(v) => {
              setVendorId(v)
              setErrs((x) => ({ ...x, vendor: undefined }))
            }}
            options={normalize(vendors.options)}
            failed={vendors.failed}
            error={errs.vendor}
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

          {/* bill copy and notes side by side */}
          <div style={full}>
            <div className="grid gap-4" style={{ gridTemplateColumns: cols >= 2 ? 'minmax(0, 1.25fr) minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
              <BillField
                file={billFile}
                onFileChange={(f) => {
                  setBillFile(f)
                  if (f) setBillRemoved(false)
                }}
                existingName={initial?.bill_name}
                onViewExisting={viewBill}
                onRemoveExisting={() => setBillRemoved(true)}
                removed={billRemoved}
                disabled={saving}
              />

              <Field label="Notes" optional>
                <div className={`${fieldBase} items-start border-black/10`}>
                  <StickyNote size={18} className="mt-3.5 shrink-0 text-gravel" />
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bill no or remarks"
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
            <h3 className="text-[15px] font-semibold text-ink">Purchase summary</h3>
            <p className="mt-0.5 text-xs text-gravel">{formatDate(date)}</p>
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
          <div className="flex items-start justify-between gap-4 text-sm">
            <dt className="text-gravel">
              Subtotal
              {hasLine && <span className="mt-0.5 block text-xs text-gravel/70">{quantity} × {money(Number(rate))}</span>}
            </dt>
            <dd className="font-medium tabular-nums text-ink">{money(total)}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl bg-ink px-4 py-4">
          <p className="text-xs text-gravel">Total amount</p>
          <p className={`mt-1 font-display font-bold tabular-nums text-signal ${asideW >= 340 ? 'text-3xl' : 'text-2xl'}`}>{money(total)}</p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-ink">
            Payment status <span className="font-normal text-gravel">(optional)</span>
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

        {shownError && side && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
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
              {4 - missing.length} of 4 required fields done
            </p>
            <p className="mt-1 text-xs text-gravel">Still needed: {missing.join(', ')}</p>
          </div>
        )}
      </aside>
    </form>
  )
}