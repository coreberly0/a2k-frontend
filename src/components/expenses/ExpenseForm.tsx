'use client'
import { useState, FormEvent } from 'react'
import FilePicker from './FilePicker'
import ExistingFiles from './ExistingFiles'

export type Option = { id: string; label: string }

export type Expense = {
  id: string
  amount: number | string
  expense_date: string
  category_id: string | null
  vehicle_id: string | null
  driver_id: string | null
  vendor_id: string | null
  category?: { id: string; name: string } | null
  vehicle?: { plate_number: string; type: string | null } | null
  driver?: { full_name: string; phone: string | null } | null
  vendor?: { name: string } | null
}

export type ExpenseValues = {
  amount: number
  expense_date: string
  category_id: string | null
  vehicle_id: string | null
  driver_id: string | null
  vendor_id: string | null
}

type Props = {
  initial?: Expense | null
  categories: Option[]
  vehicles: Option[]
  drivers: Option[]
  vendors: Option[]
  saving: boolean
  error: string
  lookupsLoading: boolean
  failedLookups: string[] // e.g. ['/vehicles', '/drivers']
  onSubmit: (values: ExpenseValues, files: File[]) => void
  onCancel: () => void
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA') // yyyy-mm-dd in local time
}

function SelectField({
  label,
  plural,
  value,
  onChange,
  options,
  loading,
  failed,
}: {
  label: string
  plural: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  loading: boolean
  failed: boolean
}) {
  const showMessage = !loading && options.length === 0
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full border rounded px-3 py-2 bg-white disabled:bg-gray-100"
      >
        <option value="">{loading ? 'Loading...' : '-- None --'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {showMessage && (
        <p className={`text-xs mt-1 ${failed ? 'text-red-600' : 'text-gray-500'}`}>
          {failed ? `Could not load ${plural}. Check your connection.` : `No ${plural} found`}
        </p>
      )}
    </div>
  )
}

export default function ExpenseForm({
  initial,
  categories,
  vehicles,
  drivers,
  vendors,
  saving,
  error,
  lookupsLoading,
  failedLookups,
  onSubmit,
  onCancel,
}: Props) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.expense_date?.slice(0, 10) ?? todayStr())
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicle_id ?? '')
  const [driverId, setDriverId] = useState(initial?.driver_id ?? '')
  const [vendorId, setVendorId] = useState(initial?.vendor_id ?? '')
  const [files, setFiles] = useState<File[]>([])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(
      {
        amount: Number(amount),
        expense_date: date,
        category_id: categoryId || null,
        vehicle_id: vehicleId || null,
        driver_id: driverId || null,
        vendor_id: vendorId || null,
      },
      files
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <SelectField
          label="Category"
          plural="categories"
          value={categoryId}
          onChange={setCategoryId}
          options={categories}
          loading={lookupsLoading}
          failed={failedLookups.includes('/expense-categories')}
        />
        <SelectField
          label="Vehicle"
          plural="vehicles"
          value={vehicleId}
          onChange={setVehicleId}
          options={vehicles}
          loading={lookupsLoading}
          failed={failedLookups.includes('/vehicles')}
        />
        <SelectField
          label="Driver"
          plural="drivers"
          value={driverId}
          onChange={setDriverId}
          options={drivers}
          loading={lookupsLoading}
          failed={failedLookups.includes('/drivers')}
        />
        <SelectField
          label="Vendor"
          plural="vendors"
          value={vendorId}
          onChange={setVendorId}
          options={vendors}
          loading={lookupsLoading}
          failed={failedLookups.includes('/vendors')}
        />

        {/* Edit mode: show files that are already saved on this expense */}
        {initial && <ExistingFiles expenseId={initial.id} />}

        {/* New files to upload when you press Save */}
        <FilePicker files={files} onChange={setFiles} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border text-sm">
          Cancel
        </button>
        <button
          disabled={saving}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}