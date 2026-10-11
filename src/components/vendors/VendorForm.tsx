'use client'
import { useState, FormEvent } from 'react'
import FormField, { inputClass } from '@/components/ui/FormField'
import FormButtons from '@/components/ui/FormButtons'
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
  onCancel: () => void
}

export default function VendorForm({ initial, saving, error, onSubmit, onCancel }: Props) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <FormField label="Name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Phone">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="GSTIN">
        <input value={gstin} onChange={(e) => setGstin(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Address">
        <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </FormField>

      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  )
}