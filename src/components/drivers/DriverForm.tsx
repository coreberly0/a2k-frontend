'use client'
import { useState, FormEvent } from 'react'
import {
  UserRound, Phone, MapPin, IdCard, CalendarDays, Truck, Fingerprint,
  CreditCard, ShieldCheck, Contact, FileText, Map,
} from 'lucide-react'
import { Field, SectionCard, fieldBase, inputBase } from '@/components/ui/formKit'
import { orNull } from '@/lib/format'

export type VehicleOption = {
  id: string
  plate_number: string
  type?: string | null
}

export type Driver = {
  id: string
  full_name: string
  phone: string | null
  address: string | null
  license_number: string | null
  license_expiry: string | null // YYYY-MM-DD
  aadhar_number: string | null
  pan_number: string | null
  vehicle_id: string | null
  is_available: boolean
  vehicle?: { plate_number: string; type: string | null } | null
}

type Props = {
  initial?: Driver | null
  vehicles: VehicleOption[]
  saving: boolean
  error?: string | null
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const DRIVER_FORM_ID = 'driver-form'

// same rules as the backend
const AADHAR_RE = /^\d{12}$/
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

// "123456789012" -> "1234 5678 9012"
function formatAadhar(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// short status text for the licence expiry
function licenceNote(expiry: string) {
  if (!expiry) return null
  const date = new Date(`${expiry}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { text: `Expired ${Math.abs(days)} day(s) ago`, className: 'text-red-600' }
  if (days <= 30) return { text: `Expires in ${days} day(s)`, className: 'text-amber-600' }
  return { text: `Valid, ${days} days left`, className: 'text-emerald-600' }
}

export default function DriverForm({ initial, vehicles, error, onSubmit }: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [licenseNumber, setLicenseNumber] = useState(initial?.license_number ?? '')
  const [licenseExpiry, setLicenseExpiry] = useState(initial?.license_expiry ?? '')
  const [aadhar, setAadhar] = useState(formatAadhar(initial?.aadhar_number ?? ''))
  const [pan, setPan] = useState(initial?.pan_number ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicle_id ?? '')
  // new drivers start as available
  const [isAvailable, setIsAvailable] = useState(initial ? initial.is_available : true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const note = licenceNote(licenseExpiry)
  const clear = (key: string) => setErrors((p) => ({ ...p, [key]: '' }))

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const aadharDigits = aadhar.replace(/\D/g, '')
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (aadharDigits && !AADHAR_RE.test(aadharDigits)) next.aadhar = 'Aadhaar number must be 12 digits'
    if (pan && !PAN_RE.test(pan)) next.pan = 'PAN must look like ABCDE1234F'
    setErrors(next)
    if (Object.keys(next).length) return

    onSubmit({
      full_name: fullName.trim(),
      phone: orNull(phone),
      address: orNull(address),
      license_number: orNull(licenseNumber),
      license_expiry: licenseExpiry || null,
      aadhar_number: aadharDigits || null,
      pan_number: orNull(pan),
      vehicle_id: vehicleId || null,
      is_available: isAvailable,
    })
  }

  return (
    <form id={DRIVER_FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-6 pb-4 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* live preview strip */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-ink p-5 text-white">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-signal text-lg font-bold text-ink">
          {initials(fullName) || <UserRound size={24} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold">{fullName.trim() || 'New driver'}</p>
          <p className="truncate text-sm text-white/60">
            {[licenseNumber && `DL ${licenseNumber}`, phone, selectedVehicle?.plate_number]
              .filter(Boolean)
              .join('  ·  ') || 'Details will appear here as you type'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            isAvailable ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/60'
          }`}
        >
          {isAvailable ? 'Available' : 'Not available'}
        </span>
      </div>

      <SectionCard icon={IdCard} title="Driver details" description="Name and how to reach the driver.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name" required error={errors.fullName}>
            <div className={`${fieldBase} ${errors.fullName ? 'border-red-300' : 'border-black/10'}`}>
              <UserRound size={18} className="shrink-0 text-gravel" />
              <input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  clear('fullName')
                }}
                placeholder="e.g. Ravi Kumar"
                autoFocus
                className={inputBase}
              />
            </div>
          </Field>

          <Field label="Phone" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Phone size={18} className="shrink-0 text-gravel" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="98765 43210"
                className={inputBase}
              />
            </div>
          </Field>
        </div>

        <Field label="Address" optional>
          <div className={`${fieldBase} items-start border-black/10`}>
            <MapPin size={18} className="mt-3.5 shrink-0 text-gravel" />
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door no., street, area, landmark"
              className={`${inputBase} resize-none`}
            />
          </div>
        </Field>
      </SectionCard>

      <SectionCard icon={Contact} title="Driving licence" description="Licence number and expiry date.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Licence number" optional>
            <div className={`${fieldBase} border-black/10`}>
              <FileText size={18} className="shrink-0 text-gravel" />
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                placeholder="TN01 20200012345"
                className={`${inputBase} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
              />
            </div>
          </Field>

          <Field label="Licence expiry" optional>
            <div className={`${fieldBase} border-black/10`}>
              <CalendarDays size={18} className="shrink-0 text-gravel" />
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className={inputBase}
              />
            </div>
            {note && <p className={`mt-1.5 text-xs font-medium ${note.className}`}>{note.text}</p>}
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Map} title="Identity documents" description="Aadhaar and PAN. Each must be unique.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Aadhaar number" optional error={errors.aadhar}>
            <div className={`${fieldBase} ${errors.aadhar ? 'border-red-300' : 'border-black/10'}`}>
              <Fingerprint size={18} className="shrink-0 text-gravel" />
              <input
                value={aadhar}
                onChange={(e) => {
                  setAadhar(formatAadhar(e.target.value))
                  clear('aadhar')
                }}
                inputMode="numeric"
                maxLength={14}
                placeholder="1234 5678 9012"
                className={`${inputBase} font-mono`}
              />
              <span className="shrink-0 text-xs tabular-nums text-gravel">
                {aadhar.replace(/\D/g, '').length}/12
              </span>
            </div>
          </Field>

          <Field label="PAN" optional error={errors.pan}>
            <div className={`${fieldBase} ${errors.pan ? 'border-red-300' : 'border-black/10'}`}>
              <CreditCard size={18} className="shrink-0 text-gravel" />
              <input
                value={pan}
                onChange={(e) => {
                  setPan(e.target.value.replace(/\s+/g, '').toUpperCase())
                  clear('pan')
                }}
                maxLength={10}
                placeholder="ABCDE1234F"
                className={`${inputBase} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
              />
              <span className="shrink-0 text-xs tabular-nums text-gravel">{pan.length}/10</span>
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Truck} title="Assignment" description="Vehicle and availability.">
        <div className="grid items-end gap-5 md:grid-cols-2">
          <Field label="Vehicle" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Truck size={18} className="shrink-0 text-gravel" />
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputBase}>
                <option value="">No vehicle assigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number}
                    {v.type ? ` · ${v.type}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <button
            type="button"
            role="switch"
            aria-checked={isAvailable}
            onClick={() => setIsAvailable((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-black/10 px-3.5 py-3 text-left transition hover:bg-black/[0.02]"
          >
            <ShieldCheck size={18} className="shrink-0 text-gravel" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">Available for trips</span>
              <span className="block text-xs text-gravel">Turn off for leave. Use this instead of deleting.</span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                isAvailable ? 'bg-signal' : 'bg-black/15'
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                  isAvailable ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </div>
      </SectionCard>
    </form>
  )
}