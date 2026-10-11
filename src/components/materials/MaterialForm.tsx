'use client'
import { useState, FormEvent } from 'react'
import FormField, { inputClass } from '@/components/ui/FormField'
import FormButtons from '@/components/ui/FormButtons'

export type Material = {
  id: string
  name: string
}

type Props = {
  initial?: Material | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
}

export default function MaterialForm({ initial, saving, error, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({ name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <FormField label="Name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </FormField>

      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  )
}