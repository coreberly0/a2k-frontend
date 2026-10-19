'use client'
import { useState } from 'react'
import { UserRound, Phone, Mail, MapPin, FileText, Building2, Hash, Landmark, Globe, IdCard, Contact, Map } from 'lucide-react'
import { Field, SectionCard, fieldBase, inputBase } from '@/components/ui/formKit'

export interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  gstin?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  pincode?: string | null
  created_at?: string
}

type Props = {
  initial: Customer | null
  saving: boolean
  error?: string | null
  onSubmit: (values: Partial<Customer>) => void
}

/** The panel footer buttons submit this form through its id. */
export const CUSTOMER_FORM_ID = 'customer-form'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

export default function CustomerForm({ initial, error, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [gstin, setGstin] = useState(initial?.gstin ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  // new customers default to India; existing ones keep whatever is saved
  const [country, setCountry] = useState(initial ? initial.country ?? '' : 'India')
  const [nameError, setNameError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setNameError('Name is required')
    setNameError('')
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      gstin: gstin.trim().toUpperCase() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
      pincode: pincode.trim() || null,
    })
  }

  return (
    <form id={CUSTOMER_FORM_ID} onSubmit={handleSubmit} className="space-y-6 pb-4 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* live preview strip */}
      <div className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-white">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-signal text-lg font-bold text-ink">
          {initials(name) || <UserRound size={24} />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">{name.trim() || 'New customer'}</p>
          <p className="truncate text-sm text-white/60">
            {[gstin && `GSTIN ${gstin}`, phone, city].filter(Boolean).join('  ·  ') || 'Details will appear here as you type'}
          </p>
        </div>
      </div>

      <SectionCard icon={IdCard} title="Customer details" description="Who you sell to and their tax number.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name" required error={nameError}>
            <div className={`${fieldBase} ${nameError ? 'border-red-300' : 'border-black/10'}`}>
              <UserRound size={18} className="shrink-0 text-gravel" />
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError('')
                }}
                placeholder="e.g. Sri Murugan Traders"
                autoFocus
                className={inputBase}
              />
            </div>
          </Field>

          <Field label="GSTIN" optional>
            <div className={`${fieldBase} border-black/10`}>
              <FileText size={18} className="shrink-0 text-gravel" />
              <input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={15}
                placeholder="15-character GST number"
                className={`${inputBase} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
              />
              <span className="shrink-0 text-xs tabular-nums text-gravel">{gstin.length}/15</span>
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Contact} title="Contact" description="How to reach this customer.">
        <div className="grid gap-5 md:grid-cols-2">
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
          <Field label="Email" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Mail size={18} className="shrink-0 text-gravel" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={inputBase}
              />
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Map} title="Address" description="Used on invoices and for delivery.">
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

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="City" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Building2 size={18} className="shrink-0 text-gravel" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chennai"
                className={inputBase}
              />
            </div>
          </Field>
          <Field label="Pincode" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Hash size={18} className="shrink-0 text-gravel" />
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="600001"
                className={inputBase}
              />
            </div>
          </Field>
          <Field label="State" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Landmark size={18} className="shrink-0 text-gravel" />
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                list="customer-states"
                placeholder="Select or type"
                className={inputBase}
              />
              <datalist id="customer-states">
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </Field>
          <Field label="Country" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Globe size={18} className="shrink-0 text-gravel" />
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className={inputBase}
              />
            </div>
          </Field>
        </div>
      </SectionCard>
    </form>
  )
}