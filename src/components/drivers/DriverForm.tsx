'use client'
import { useState, FormEvent } from 'react'
import { UserRound, Phone } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'
import { orNull } from '@/lib/format'

export type Driver = {
  id: string
  full_name: string
  phone: string | null
}

type Props = {
  initial?: Driver | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const DRIVER_FORM_ID = 'driver-form'

export default function DriverForm({ initial, error, onSubmit }: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({ full_name: fullName.trim(), phone: orNull(phone) })
  }

  return (
    <form id={DRIVER_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Driver details">
        <Field label="Full name" required>
          <div className={`${fieldBase} border-black/10`}>
            <UserRound size={18} className="shrink-0 text-gravel" />
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
      </Section>
    </form>
  )
}