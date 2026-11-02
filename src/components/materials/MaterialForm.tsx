'use client'
import { useState, FormEvent } from 'react'
import { Boxes, Ruler, Hash } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'

export type Material = {
  id: string
  name: string
  unit?: string | null
  hsn_code?: string | null
}

type Props = {
  initial?: Material | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const MATERIAL_FORM_ID = 'material-form'

const UNITS = ['Ton', 'Unit', 'Load', 'Kg', 'Bag', 'Cu.ft']

export default function MaterialForm({ initial, error, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [hsn, setHsn] = useState(initial?.hsn_code ?? '')
  const [hsnError, setHsnError] = useState('')

  const box = `${fieldBase} border-black/10`

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // HSN is optional, but when given it must be 4, 6 or 8 digits (same rule as the backend)
    if (hsn && !/^(\d{4}|\d{6}|\d{8})$/.test(hsn)) {
      setHsnError('HSN code must be 4, 6 or 8 digits')
      return
    }
    setHsnError('')
    onSubmit({
      name: name.trim(),
      unit: unit.trim(), // empty is skipped by the backend, which then keeps its default
      hsn_code: hsn || null, // null clears the code
    })
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
          <div className={box}>
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

        <Field label="Unit" optional>
          <div className={box}>
            <Ruler size={18} className="shrink-0 text-gravel" />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Ton"
              className={inputBase}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  unit.toLowerCase() === u.toLowerCase()
                    ? 'border-signal bg-signal/25 text-ink'
                    : 'border-black/10 text-gravel hover:bg-black/5 hover:text-ink'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>

        <Field label="HSN code" optional>
          <div className={`${fieldBase} ${hsnError ? 'border-red-400' : 'border-black/10'}`}>
            <Hash size={18} className="shrink-0 text-gravel" />
            <input
              inputMode="numeric"
              maxLength={8}
              value={hsn}
              onChange={(e) => {
                setHsn(e.target.value.replace(/\D/g, ''))
                setHsnError('')
              }}
              placeholder="e.g. 2505 or 25051000"
              className={`${inputBase} tabular-nums`}
            />
          </div>
          {hsnError ? (
            <p className="mt-1.5 text-xs text-red-600">{hsnError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gravel">4, 6 or 8 digits. Printed on the tax invoice.</p>
          )}
        </Field>
      </Section>
    </form>
  )
}