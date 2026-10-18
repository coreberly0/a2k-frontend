'use client'
import { useState, FormEvent } from 'react'
import { Truck, Tag } from 'lucide-react'
import { Field, Section, fieldBase, inputBase } from '@/components/ui/formKit'
import { orNull } from '@/lib/format'

export type Vehicle = {
  id: string
  plate_number: string
  type?: string | null
}

type Props = {
  initial?: Vehicle | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const VEHICLE_FORM_ID = 'vehicle-form'

// quick picks for the type field (you can still type anything)
const TYPE_SUGGESTIONS = ['Tipper', 'Lorry', 'Truck', 'Tractor', 'JCB']

export default function VehicleForm({ initial, error, onSubmit }: Props) {
  const [plate, setPlate] = useState(initial?.plate_number ?? '')
  const [type, setType] = useState(initial?.type ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({
      plate_number: plate.trim().toUpperCase(),
      type: orNull(type),
    })
  }

  return (
    <form id={VEHICLE_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Vehicle details">
        <Field label="Plate number" required>
          <div className={`${fieldBase} border-black/10`}>
            <Truck size={18} className="shrink-0 text-gravel" />
            <input
              required
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="e.g. TN 09 AB 1234"
              autoFocus
              className={`${inputBase} uppercase`}
            />
          </div>
        </Field>

        <Field label="Type" optional>
          <div className={`${fieldBase} border-black/10`}>
            <Tag size={18} className="shrink-0 text-gravel" />
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Tipper"
              className={inputBase}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {TYPE_SUGGESTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  type.trim().toLowerCase() === t.toLowerCase()
                    ? 'border-ink bg-ink text-signal'
                    : 'border-black/10 bg-white text-ink hover:bg-black/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      </Section>
    </form>
  )
}