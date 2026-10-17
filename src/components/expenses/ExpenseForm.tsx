'use client'
import { useState, FormEvent } from 'react'
import { CalendarDays, Contact, IndianRupee, Store, Tag, Truck } from 'lucide-react'
import { Field, Section, Dropdown, normalize, fieldBase, inputBase } from '@/components/ui/formKit'
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
}

/** The panel footer buttons submit this form through its id. */
export const EXPENSE_FORM_ID = 'expense-form'

function todayStr() {
  return new Date().toLocaleDateString('en-CA') // yyyy-mm-dd in local time
}

export default function ExpenseForm({
  initial,
  categories,
  vehicles,
  drivers,
  vendors,
  error,
  lookupsLoading,
  failedLookups,
  onSubmit,
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
    <form id={EXPENSE_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Expense details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
            <div className={`${fieldBase} border-black/10`}>
              <IndianRupee size={18} className="shrink-0 text-gravel" />
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputBase}
              />
            </div>
          </Field>
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
        </div>
      </Section>

      <Section title="Category and vendor">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Category"
            icon={Tag}
            value={categoryId}
            onChange={setCategoryId}
            options={normalize(categories)}
            loading={lookupsLoading}
            failed={failedLookups.includes('/expense-categories')}
          />
          <Dropdown
            label="Vendor"
            icon={Store}
            value={vendorId}
            onChange={setVendorId}
            options={normalize(vendors)}
            loading={lookupsLoading}
            failed={failedLookups.includes('/vendors')}
          />
        </div>
      </Section>

      <Section title="Vehicle and driver">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Vehicle"
            icon={Truck}
            value={vehicleId}
            onChange={setVehicleId}
            options={normalize(vehicles)}
            loading={lookupsLoading}
            failed={failedLookups.includes('/vehicles')}
          />
          <Dropdown
            label="Driver"
            icon={Contact}
            value={driverId}
            onChange={setDriverId}
            options={normalize(drivers)}
            loading={lookupsLoading}
            failed={failedLookups.includes('/drivers')}
          />
        </div>
      </Section>

      <Section title="Attachments">
        {/* Edit mode: files already saved on this expense */}
        {initial && <ExistingFiles expenseId={initial.id} />}

        {/* New files, uploaded when you press save */}
        <div className="space-y-2">
          {initial && <p className="text-sm font-medium text-ink">Add new files</p>}
          <FilePicker files={files} onChange={setFiles} />
        </div>
      </Section>
    </form>
  )
}