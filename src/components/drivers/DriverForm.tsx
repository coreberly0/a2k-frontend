'use client'
import { useState, FormEvent } from 'react'
import FormField, { inputClass } from '@/components/ui/FormField'
import FormButtons from '@/components/ui/FormButtons'
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
  onCancel: () => void
}

export default function DriverForm({ initial, saving, error, onSubmit, onCancel }: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({ full_name: fullName.trim(), phone: orNull(phone) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <FormField label="Full name">
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Phone">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
      </FormField>

      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  )
}