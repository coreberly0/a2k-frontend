'use client'
import { useState, FormEvent } from 'react'
import FormField, { inputClass } from '@/components/ui/FormField'
import SelectField from '@/components/ui/SelectField'
import FormButtons from '@/components/ui/FormButtons'
import { useOptions } from '@/hooks/useOptions'
import { money, orNull, todayStr } from '@/lib/format'

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
  customer?: { name: string } | null
  material?: { name: string } | null
  vehicle?: { plate_number: string } | null
}

type Props = {
  initial?: Sale | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
}

export default function SaleForm({ initial, saving, error, onSubmit, onCancel }: Props) {
  const customers = useOptions('/vendors', (r) => r.name)
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

  const base = Number(quantity || 0) * Number(rate || 0)
  const total = base + (withGst ? (base * Number(gstPercent || 0)) / 100 : 0)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
    onSubmit(body)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bill No">
            <input required value={billNo} onChange={(e) => setBillNo(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Date">
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </FormField>
        </div>

        <SelectField label="Customer" required value={customerId} onChange={setCustomerId}
          options={customers.options} failed={customers.failed} />
        <SelectField label="Material" required value={materialId} onChange={setMaterialId}
          options={materials.options} failed={materials.failed} />
        <SelectField label="Vehicle" value={vehicleId} onChange={setVehicleId}
          options={vehicles.options} failed={vehicles.failed} />
        <SelectField label="Driver" value={driverId} onChange={setDriverId}
          options={drivers.options} failed={drivers.failed} />

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quantity">
            <input type="number" step="any" min="0" required value={quantity}
              onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Rate">
            <input type="number" step="any" min="0" required value={rate}
              onChange={(e) => setRate(e.target.value)} className={inputClass} />
          </FormField>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withGst} onChange={(e) => setWithGst(e.target.checked)} />
            With GST
          </label>
          {withGst && (
            <input
              type="number" step="any" min="0" placeholder="GST %"
              value={gstPercent} onChange={(e) => setGstPercent(e.target.value)}
              className="w-28 border rounded px-3 py-2 bg-white"
            />
          )}
        </div>

        <FormField label="Payment">
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputClass}>
            <option value="">-- Select --</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </FormField>

        <FormField label="Notes">
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </FormField>

        <p className="text-sm">
          Total: <span className="font-bold">{money(total)}</span>
        </p>
      </div>

      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  )
}