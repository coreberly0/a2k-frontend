'use client'
import { useState, FormEvent } from 'react'
import { CalendarDays, Store, Boxes, Truck, Package, IndianRupee, StickyNote } from 'lucide-react'
import { useOptions } from '@/hooks/useOptions'
import { money, todayStr } from '@/lib/format'
import { Field, Section, Dropdown, normalize, fieldBase, inputBase } from '@/components/ui/formKit'
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

  const total = Number(quantity || 0) * Number(rate || 0)

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

  return (
    <form id={PURCHASE_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {(error || viewError) && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error || viewError}
        </p>
      )}

      <Section title="Purchase details">
        <Field label="Date" required>
          <div className={`${fieldBase} border-black/10`}>
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
      </Section>

      <Section title="Vendor and material">
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </Section>

      <Section title="Transport">
        <Dropdown
          label="Vehicle"
          icon={Truck}
          value={vehicleId}
          onChange={setVehicleId}
          options={normalize(vehicles.options)}
          failed={vehicles.failed}
        />
      </Section>

      <Section title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity" required>
            <div className={`${fieldBase} border-black/10`}>
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
            <div className={`${fieldBase} border-black/10`}>
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
        </div>
      </Section>

      <Section title="Payment">
        <Field label="Payment status" optional>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-black/10 bg-paper/60 p-1">
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
                  payment === o.v ? `${o.on} shadow` : 'text-gravel hover:bg-black/5 hover:text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Bill and notes">
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
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bill number, delivery remarks, anything to remember"
              className={`${inputBase} resize-none`}
            />
          </div>
        </Field>
      </Section>

      {/* purchase summary */}
      <div className="overflow-hidden rounded-2xl bg-ink text-paper">
        <div className="space-y-2 px-5 pt-4 text-sm">
          <div className="flex justify-between text-gravel">
            <span>
              Subtotal
              {Number(quantity) > 0 && Number(rate) > 0 && (
                <span className="ml-2 text-xs text-gravel/70">
                  {quantity} × {money(Number(rate))}
                </span>
              )}
            </span>
            <span className="tabular-nums text-paper">{money(total)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-sm font-medium">Total amount</span>
          <span className="font-display text-3xl font-bold tabular-nums text-signal">{money(total)}</span>
        </div>
      </div>
    </form>
  )
}