'use client'
import { useState, FormEvent } from 'react'
import { Boxes } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'

export type Material = {
  id: string
  name: string
}

type Props = {
  initial?: Material | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const MATERIAL_FORM_ID = 'material-form'

export default function MaterialForm({ initial, error, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({ name: name.trim() })
  }

  return (
    <form id={MATERIAL_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Material details">
        <Field label="Name" required>
          <div className={`${fieldBase} border-black/10`}>
            <Boxes size={18} className="shrink-0 text-gravel" />
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. M-Sand, 20mm Jelly, Blue Metal"
              autoFocus
              className={inputBase}
            />
          </div>
        </Field>
      </Section>
    </form>
  )
}