'use client'
import { useState } from 'react'
import { UserRound, Phone, Mail, MapPin } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'

export interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
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

export default function CustomerForm({ initial, error, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [nameError, setNameError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setNameError('Name is required')
    setNameError('')
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
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

        <Field label="Address" optional>
          <div className={`${fieldBase} items-start border-black/10`}>
            <MapPin size={18} className="mt-3.5 shrink-0 text-gravel" />
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, pincode"
              className={`${inputBase} resize-none`}
            />
          </div>
        </Field>
      </Section>
    </form>
  )
}