'use client'
import { useState, FormEvent, ReactNode } from 'react'
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

/* ---------- expiry helpers (browser local time) ---------- */
const DAY = 86_400_000

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function parseISO(v: string) {
  return new Date(`${v}T00:00:00`)
}
function daysLeft(v: string) {
  const today = parseISO(toISO(new Date()))
  return Math.round((parseISO(v).getTime() - today.getTime()) / DAY)
}
/** One year after the current expiry if still in the future, otherwise one year from today. */
function renewFrom(v: string) {
  const today = toISO(new Date())
  const base = v && v > today ? parseISO(v) : parseISO(today)
  base.setFullYear(base.getFullYear() + 1)
  return toISO(base)
}

type Tone = 'bad' | 'warn' | 'good'
function expiryInfo(v: string): { tone: Tone; text: string } | null {
  if (!v) return null
  const d = daysLeft(v)
  if (d < 0) return { tone: 'bad', text: `Expired ${-d} day${-d === 1 ? '' : 's'} ago` }
  if (d === 0) return { tone: 'warn', text: 'Expires today' }
  if (d <= 30) return { tone: 'warn', text: `Expires in ${d} day${d === 1 ? '' : 's'}` }
  return { tone: 'good', text: `Valid, ${d} days left` }
}
const TONE_TEXT: Record<Tone, string> = {
  bad: 'text-red-700',
  warn: 'text-amber-700',
  good: 'text-emerald-700',
}
const TONE_DOT: Record<Tone, string> = {
  bad: 'bg-red-600',
  warn: 'bg-amber-500',
  good: 'bg-emerald-600',
}

/* ---------- shared styles ---------- */
const inputCls =
  'block h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm text-ink outline-none ' +
  'transition placeholder:text-gravel/80 focus:border-steel focus:ring-2 focus:ring-steel/20 ' +
  'disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-gravel'

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <header className="border-b border-black/10 bg-black/[0.02] px-6 py-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-gravel">{description}</p>
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Field({
  label, htmlFor, required, hint, children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && <div className="mt-1.5 text-xs text-gravel">{hint}</div>}
    </div>
  )
}

function ExpiryField({
  id, label, value, onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const info = expiryInfo(value)
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={
        <div className="flex items-center justify-between gap-3">
          {info ? (
            <span className={`inline-flex items-center gap-1.5 font-medium ${TONE_TEXT[info.tone]}`}>
              <span className={`size-1.5 rounded-full ${TONE_DOT[info.tone]}`} />
              {info.text}
            </span>
          ) : (
            <span>Not set</span>
          )}
          <button
            type="button"
            onClick={() => onChange(renewFrom(value))}
            className="font-medium text-steel hover:underline focus-visible:outline-2 focus-visible:outline-steel"
          >
            Renew +1 year
          </button>
        </div>
      }
    >
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  )
}

export default function VehicleForm({ initial, saving, error, onSubmit }: Props) {
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
    <form id={VEHICLE_FORM_ID} onSubmit={handleSubmit} className="@container w-full pb-10 text-ink">
      {error && (
        <p role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* locks every input while saving */}
      <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
        <div className="grid items-start gap-6 @4xl:grid-cols-3">
          {/* ================= left: main details ================= */}
          <div className="space-y-6 @4xl:col-span-2">
            <Card title="Vehicle details" description="Registration number, type and load capacity.">
              <div className="grid gap-5 @2xl:grid-cols-2 @6xl:grid-cols-3">
                <Field label="Plate number" htmlFor="v-plate" required>
                  <input
                    id="v-plate"
                    required
                    autoFocus
                    autoComplete="off"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, ''))}
                    placeholder="TN 09 AB 1234"
                    className={`${inputCls} font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}
                  />
                </Field>

                <Field label="Vehicle type" htmlFor="v-type">
                  <input
                    id="v-type"
                    list="v-type-options"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Select or type"
                    className={inputCls}
                  />
                  <datalist id="v-type-options">
                    {TYPE_SUGGESTIONS.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </Field>

                <Field label="Capacity" htmlFor="v-capacity">
                  <div className="relative">
                    <input
                      id="v-capacity"
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={`${inputCls} pr-14`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gravel">
                      tons
                    </span>
                  </div>
                </Field>
              </div>
            </Card>

            <Card title="Notes" description="Driver, permit details or service reminders.">
              <Field label="Notes" htmlFor="v-notes">
                <textarea
                  id="v-notes"
                  rows={7}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any details worth remembering"
                  className={`${inputCls} h-auto resize-y py-2.5`}
                />
              </Field>
            </Card>
          </div>

          {/* ================= right: status and renewals ================= */}
          <div className="space-y-6">
            <Card title="Status" description="Mark vehicles that are out of service as inactive.">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p id="v-active-label" className="text-sm font-medium">
                    {active ? 'Active' : 'Inactive'}
                  </p>
                  <p className="mt-0.5 text-xs text-gravel">
                    {active ? 'This vehicle is in service.' : 'This vehicle is out of service.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  aria-labelledby="v-active-label"
                  onClick={() => setActive((a) => !a)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel
                    ${active ? 'bg-steel' : 'bg-black/20'}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform
                      ${active ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </Card>

            <Card title="Insurance and tax" description="Renewal dates, so expiries are easy to track.">
              <div className="space-y-5">
                <ExpiryField id="v-insurance" label="Insurance expiry" value={insurance} onChange={setInsurance} />
                <ExpiryField id="v-tax" label="Tax expiry" value={tax} onChange={setTax} />
              </div>
            </Card>
          </div>
        </div>
      </fieldset>
    </form>
  )
}