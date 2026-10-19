'use client'
import { useState } from 'react'
import { UserRound, Phone, Mail, MapPin, FileText, Building2, Hash, Landmark, Globe } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'

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
    <form id={CUSTOMER_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Customer details">
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
              className={`${inputBase} uppercase`}
            />
          </div>
        </Field>
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
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
      </Section>

      <Section title="Address">
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

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
      </Section>
    </form>
  )
}