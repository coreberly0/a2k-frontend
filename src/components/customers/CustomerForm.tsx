'use client'
import { useState } from 'react'

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
  onCancel: () => void
}

const inputCls =
  'w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none ' +
  'focus:border-steel focus:ring-2 focus:ring-steel/20'

export default function CustomerForm({ initial, saving, error, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [localError, setLocalError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setLocalError('Name is required')
    setLocalError('')
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
    })
  }

  const shownError = localError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {shownError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {shownError}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Name *</label>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Address</label>
        <textarea className={inputCls} rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-ink/15 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-steel px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : initial ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  )
}