'use client'
import { useState, FormEvent } from 'react'
import { Store, Phone, FileText, MapPin } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'
import { orNull } from '@/lib/format'

export type Vendor = {
  id: string
  name: string
  phone: string | null
  gstin: string | null
  address: string | null
}

type Props = {
  initial?: Vendor | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const VENDOR_FORM_ID = 'vendor-form'

export default function VendorForm({ initial, error, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [gstin, setGstin] = useState(initial?.gstin ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      phone: orNull(phone),
      gstin: orNull(gstin),
      address: orNull(address),
    })
  }

  return (
    <form id={VENDOR_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Vendor details">
        <Field label="Name" required>
          <div className={`${fieldBase} border-black/10`}>
            <Store size={18} className="shrink-0 text-gravel" />
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sri Lakshmi Stone Crushers"
              autoFocus
              className={inputBase}
            />
          </div>
        </Field>

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
          <Field label="GSTIN" optional>
            <div className={`${fieldBase} border-black/10`}>
              <FileText size={18} className="shrink-0 text-gravel" />
              <input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={15}
                placeholder="33AAAAA0000A1Z5"
                className={`${inputBase} uppercase`}
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
              placeholder="Street, city, pincode"
              className={`${inputBase} resize-none`}
            />
          </div>
        </Field>
      </Section>
    </form>
  )
}