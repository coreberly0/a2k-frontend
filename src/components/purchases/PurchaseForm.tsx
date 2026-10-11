'use client'
import { useState, FormEvent } from 'react'
import FormField, { inputClass } from '@/components/ui/FormField'
import SelectField from '@/components/ui/SelectField'
import FormButtons from '@/components/ui/FormButtons'
import { useOptions } from '@/hooks/useOptions'
import { money, todayStr } from '@/lib/format'

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
  vendor?: { name: string } | null
  material?: { name: string } | null
  vehicle?: { plate_number: string } | null
}

type Props = {
  initial?: Purchase | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
}

export default function PurchaseForm({ initial, saving, error, onSubmit, onCancel }: Props) {
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

  const total = Number(quantity || 0) * Number(rate || 0)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const body: Record<string, unknown> = {
      purchase_date: date,
      vendor_id: vendorId,
      material_id: materialId,
      vehicle_id: vehicleId || null,
      quantity: Number(quantity),
      rate: Number(rate),
    }
    if (payment) body.payment = payment
    onSubmit(body)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <FormField label="Date">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </FormField>

        <SelectField label="Vendor" required value={vendorId} onChange={setVendorId}
          options={vendors.options} failed={vendors.failed} />
        <SelectField label="Material" required value={materialId} onChange={setMaterialId}
          options={materials.options} failed={materials.failed} />
        <SelectField label="Vehicle" value={vehicleId} onChange={setVehicleId}
          options={vehicles.options} failed={vehicles.failed} />

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

        <FormField label="Payment">
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputClass}>
            <option value="">-- Select --</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </FormField>

        <p className="text-sm">
          Total: <span className="font-bold">{money(total)}</span>
        </p>
      </div>

      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  )
}