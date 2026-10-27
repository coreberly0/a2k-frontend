'use client'
import { useState, FormEvent } from 'react'
import {
  Truck, Tag, Weight, ShieldCheck, Receipt, StickyNote,
  IdCard, FileCheck2, NotebookPen,
} from 'lucide-react'
import { Field, SectionCard, fieldBase, inputBase } from '@/components/ui/formKit'
import { orNull } from '@/lib/format'

export type Vehicle = {
  id: string
  plate_number: string
  type?: string | null
  capacity?: number | string | null
  is_active?: boolean | null
  insurance_expiry?: string | null
  tax_expiry?: string | null
  notes?: string | null
}

type Props = {
  initial?: Vehicle | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The panel footer buttons submit this form through its id. */
export const VEHICLE_FORM_ID = 'vehicle-form'

const TYPE_SUGGESTIONS = ['Tipper', 'Lorry', 'Truck', 'Tractor', 'JCB']

export default function VehicleForm({ initial, error, onSubmit }: Props) {
  const [plate, setPlate] = useState(initial?.plate_number ?? '')
  const [type, setType] = useState(initial?.type ?? '')
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : '')
  const [active, setActive] = useState(initial?.is_active ?? true)
  const [insurance, setInsurance] = useState(initial?.insurance_expiry?.slice(0, 10) ?? '')
  const [tax, setTax] = useState(initial?.tax_expiry?.slice(0, 10) ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit({
      plate_number: plate.trim().toUpperCase(),
      type: orNull(type),
      capacity: capacity.trim() === '' ? null : Number(capacity),
      is_active: active,
      insurance_expiry: insurance || null,
      tax_expiry: tax || null,
      notes: orNull(notes),
    })
  }

  return (
    <form id={VEHICLE_FORM_ID} onSubmit={handleSubmit} className="space-y-6 pb-4 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* live preview strip */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-ink p-5 text-white">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-signal text-ink">
          <Truck size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xl font-bold tracking-wider text-signal">
            {plate.trim() || 'TN 00 XX 0000'}
          </p>
          <p className="truncate text-sm text-white/60">
            {[type.trim(), capacity && `${capacity} tons`].filter(Boolean).join('  ·  ') ||
              'Details will appear here as you type'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
          }`}
        >
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* ---------- Vehicle details ---------- */}
      <SectionCard icon={IdCard} title="Vehicle details" description="Plate number, type, capacity and status.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Plate number" required>
            <div className={`${fieldBase} border-black/10`}>
              <Truck size={18} className="shrink-0 text-gravel" />
              <input
                required
                autoFocus
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="TN 09 AB 1234"
                className={`${inputBase} font-mono uppercase placeholder:font-sans`}
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
          </Field>

          <Field label="Capacity" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Weight size={18} className="shrink-0 text-gravel" />
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 10"
                className={inputBase}
              />
              <span className="shrink-0 text-xs font-medium text-gravel">tons</span>
            </div>
          </Field>

          <Field label="Status">
            <div className="grid h-full grid-cols-2 rounded-xl border border-black/10 bg-paper/60 p-1">
              {[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setActive(o.value)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    active === o.value ? 'bg-ink text-signal shadow-sm' : 'text-gravel hover:text-ink'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-gravel">Quick pick type:</span>
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
      </SectionCard>

      {/* ---------- Insurance & tax ---------- */}
      <SectionCard icon={FileCheck2} title="Insurance & tax" description="Renewal dates, so you can track expiries.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Insurance expiry" optional>
            <div className={`${fieldBase} border-black/10`}>
              <ShieldCheck size={18} className="shrink-0 text-gravel" />
              <input type="date" value={insurance} onChange={(e) => setInsurance(e.target.value)} className={inputBase} />
            </div>
          </Field>

          <Field label="Tax expiry" optional>
            <div className={`${fieldBase} border-black/10`}>
              <Receipt size={18} className="shrink-0 text-gravel" />
              <input type="date" value={tax} onChange={(e) => setTax(e.target.value)} className={inputBase} />
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* ---------- Notes ---------- */}
      <SectionCard icon={NotebookPen} title="Notes" description="Driver, permit details, service reminders.">
        <Field label="Notes" optional>
          <div className={`${fieldBase} items-start border-black/10`}>
            <StickyNote size={18} className="mt-3.5 shrink-0 text-gravel" />
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Driver name, permit details, service reminders…"
              className={`${inputBase} resize-none`}
            />
          </div>
        </Field>
      </SectionCard>
    </form>
  )
}