'use client'
import { useEffect, useRef, useState, FormEvent } from 'react'
import {
  Hash, CalendarDays, UserRound, Boxes, Truck, Contact, Package, IndianRupee,
  Percent, ChevronDown, Check, Search, Loader2, X,
} from 'lucide-react'
import { useOptions } from '@/hooks/useOptions'
import { money, orNull, todayStr } from '@/lib/format'

export type Sale = {
  id: string
  bill_no: string
  sale_date: string
  customer_id: string | null
  material_id: string | null
  vehicle_id: string | null
  driver_id: string | null
  quantity: number | string
  rate: number | string
  with_gst: boolean
  gst_percent: number | string | null
  payment: string | null
  notes: string | null
  total_amount: number | string
  customer?: { name: string } | null
  material?: { name: string } | null
  vehicle?: { plate_number: string } | null
}

type Props = {
  initial?: Sale | null
  saving: boolean
  error: string
  onSubmit: (values: Record<string, unknown>) => void
}

/** The popup footer buttons submit this form through its id. */
export const SALE_FORM_ID = 'sale-form'

export function SaleFormActions({
  saving,
  onCancel,
  label,
}: {
  saving: boolean
  onCancel: () => void
  label: string
}) {
  return (
    <div className="flex w-full gap-3 sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-black/10 bg-white py-3 font-medium text-ink transition hover:bg-black/5 sm:flex-none sm:px-6"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={SALE_FORM_ID}
        disabled={saving}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-signal py-3 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60 sm:flex-none sm:px-8"
      >
        {saving && <Loader2 size={18} className="animate-spin" />}
        {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}

/* ---------- small building blocks ---------- */

type Opt = { value: string; label: string }

// useOptions may give {value,label} or {id,name}; accept both
function normalize(options: unknown): Opt[] {
  if (!Array.isArray(options)) return []
  return options.map((o: any) =>
    typeof o === 'string'
      ? { value: o, label: o }
      : { value: String(o.value ?? o.id ?? ''), label: String(o.label ?? o.name ?? o.value ?? '') }
  )
}

const fieldBase =
  'flex items-center gap-3 rounded-xl border bg-paper/60 px-3.5 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20'
const inputBase =
  'w-full bg-transparent py-3 text-base text-ink outline-none placeholder:text-gravel/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]'

function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {optional && <span className="ml-1.5 font-normal text-gravel">(optional)</span>}
      </span>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-3 text-sm font-semibold text-ink">
        {title}
        <span className="h-px flex-1 bg-black/5" />
      </h3>
      {children}
    </section>
  )
}

/* ---------- dropdown (list opens above or below depending on space) ---------- */

function Dropdown({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  failed,
  required,
  error,
}: {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  value: string
  onChange: (v: string) => void
  options: Opt[]
  failed?: boolean
  required?: boolean
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value)
  const showSearch = options.length > 6
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options

  function toggle() {
    if (open) return setOpen(false)
    const r = btnRef.current!.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const up = below < 260 && above > below
    setPos({
      left: r.left,
      width: r.width,
      ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      maxH: Math.min(320, up ? above : below),
    })
    setQ('')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    // the list is fixed-position, so close it if the page scrolls underneath
    const onScroll = (e: Event) => {
      if (listRef.current && listRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    const onResize = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <Field label={label} required={required} optional={!required} error={error}>
      <div
        ref={wrapRef}
        onKeyDown={(e) => {
          // Escape closes only the list, not the whole popup
          if (e.key === 'Escape' && open) {
            e.stopPropagation()
            setOpen(false)
          }
        }}
      >
        <button
          ref={btnRef}
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex w-full items-center gap-3 rounded-xl border bg-paper/60 px-3.5 py-3 text-left transition focus:outline-none focus-visible:border-signal focus-visible:ring-4 focus-visible:ring-signal/20 ${
            open
              ? 'border-signal bg-white ring-4 ring-signal/20'
              : error
                ? 'border-red-300'
                : 'border-black/10 hover:border-black/20'
          }`}
        >
          <Icon size={18} className="shrink-0 text-gravel" />
          <span className={`flex-1 truncate text-base ${current ? 'text-ink' : 'text-gravel/60'}`}>
            {current ? current.label : 'Select'}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-gravel transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && pos && (
          <div
            ref={listRef}
            role="listbox"
            style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}
            className="z-[120] flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl shadow-ink/15"
          >
            {showSearch && (
              <div className="flex items-center gap-2 border-b border-black/5 px-3">
                <Search size={16} className="shrink-0 text-gravel" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-gravel/60"
                />
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {!required && value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-gravel transition hover:bg-paper"
                >
                  <X size={15} /> Clear selection
                </button>
              )}

              {shown.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-gravel">
                  {failed ? "Couldn't load this list" : options.length === 0 ? 'Nothing to choose yet' : 'No match'}
                </p>
              ) : (
                shown.map((o) => {
                  const selected = o.value === value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(o.value)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        selected ? 'bg-signal/15 font-semibold text-ink' : 'text-ink hover:bg-paper'
                      }`}
                    >
                      <span className="flex-1 truncate">{o.label}</span>
                      {selected && <Check size={16} className="shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  )
}

/* ---------- the form ---------- */

const GST_PRESETS = ['5', '12', '18', '28']

export default function SaleForm({ initial, saving, error, onSubmit }: Props) {
  const customers = useOptions('/customers', (r) => r.name)
  const materials = useOptions('/materials', (r) => r.name)
  const vehicles = useOptions('/vehicles', (r) => r.plate_number)
  const drivers = useOptions('/drivers', (r) => r.full_name)

  const [billNo, setBillNo] = useState(initial?.bill_no ?? '')
  const [date, setDate] = useState(initial?.sale_date?.slice(0, 10) ?? todayStr())
  const [customerId, setCustomerId] = useState(initial?.customer_id ?? '')
  const [materialId, setMaterialId] = useState(initial?.material_id ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicle_id ?? '')
  const [driverId, setDriverId] = useState(initial?.driver_id ?? '')
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '')
  const [rate, setRate] = useState(initial ? String(initial.rate) : '')
  const [withGst, setWithGst] = useState(initial?.with_gst ?? false)
  const [gstPercent, setGstPercent] = useState(
    initial?.gst_percent != null ? String(initial.gst_percent) : ''
  )
  const [payment, setPayment] = useState(initial?.payment ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errs, setErrs] = useState<{ customer?: string; material?: string }>({})

  const base = Number(quantity || 0) * Number(rate || 0)
  const gstAmount = withGst ? (base * Number(gstPercent || 0)) / 100 : 0
  const total = base + gstAmount

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // the dropdowns are not native inputs, so check required ones here
    const next: typeof errs = {}
    if (!customerId) next.customer = 'Please select a customer'
    if (!materialId) next.material = 'Please select a material'
    setErrs(next)
    if (next.customer || next.material) return

    const body: Record<string, unknown> = {
      bill_no: billNo.trim(),
      sale_date: date,
      customer_id: customerId,
      material_id: materialId,
      vehicle_id: vehicleId || null,
      driver_id: driverId || null,
      quantity: Number(quantity),
      rate: Number(rate),
      with_gst: withGst,
      notes: orNull(notes),
    }
    if (withGst && gstPercent !== '') body.gst_percent = Number(gstPercent)
    if (payment) body.payment = payment
    onSubmit(body)
  }

  return (
    <form id={SALE_FORM_ID} onSubmit={handleSubmit} className="space-y-7 text-ink">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Section title="Bill details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bill no" required>
            <div className={`${fieldBase} border-black/10`}>
              <Hash size={18} className="shrink-0 text-gravel" />
              <input
                required
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                placeholder="e.g. 1024"
                className={inputBase}
              />
            </div>
          </Field>
          <Field label="Date" required>
            <div className={`${fieldBase} border-black/10`}>
              <CalendarDays size={18} className="shrink-0 text-gravel" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputBase}
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Customer and material">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Customer"
            icon={UserRound}
            required
            value={customerId}
            onChange={(v) => {
              setCustomerId(v)
              setErrs((x) => ({ ...x, customer: undefined }))
            }}
            options={normalize(customers.options)}
            failed={customers.failed}
            error={errs.customer}
          />
          <Dropdown
            label="Material"
            icon={Boxes}
            required
            value={materialId}
            onChange={(v) => {
              setMaterialId(v)
              setErrs((x) => ({ ...x, material: undefined }))
            }}
            options={normalize(materials.options)}
            failed={materials.failed}
            error={errs.material}
          />
        </div>
      </Section>

      <Section title="Transport">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Vehicle"
            icon={Truck}
            value={vehicleId}
            onChange={setVehicleId}
            options={normalize(vehicles.options)}
            failed={vehicles.failed}
          />
          <Dropdown
            label="Driver"
            icon={Contact}
            value={driverId}
            onChange={setDriverId}
            options={normalize(drivers.options)}
            failed={drivers.failed}
          />
        </div>
      </Section>

      <Section title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity" required>
            <div className={`${fieldBase} border-black/10`}>
              <Package size={18} className="shrink-0 text-gravel" />
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className={inputBase}
              />
            </div>
          </Field>
          <Field label="Rate" required>
            <div className={`${fieldBase} border-black/10`}>
              <IndianRupee size={18} className="shrink-0 text-gravel" />
              <input
                type="number"
                step="any"
                min="0"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className={inputBase}
              />
            </div>
          </Field>
        </div>

        {/* GST switch */}
        <div className="rounded-xl border border-black/10 bg-paper/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Add GST</p>
              <p className="text-xs text-gravel">Charge GST on top of the bill amount.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={withGst}
              aria-label="Add GST"
              onClick={() => setWithGst((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${withGst ? 'bg-signal' : 'bg-black/15'}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                  withGst ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {withGst && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
              <div className={`${fieldBase} w-32 border-black/10 bg-white`}>
                <Percent size={16} className="shrink-0 text-gravel" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="GST"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  className={`${inputBase} py-2.5`}
                />
              </div>
              {GST_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setGstPercent(p)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    gstPercent === p
                      ? 'border-ink bg-ink text-signal'
                      : 'border-black/10 bg-white text-ink hover:bg-black/5'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Payment and notes">
        <Field label="Payment" optional>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-black/10 bg-paper/60 p-1">
            {[
              { v: 'paid', label: 'Paid', on: 'bg-green-600 text-white' },
              { v: 'unpaid', label: 'Unpaid', on: 'bg-amber-500 text-white' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={payment === o.v}
                // click again to clear, since payment is optional
                onClick={() => setPayment(payment === o.v ? '' : o.v)}
                className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                  payment === o.v ? `${o.on} shadow` : 'text-gravel hover:bg-black/5 hover:text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notes" optional>
          <div className={`${fieldBase} border-black/10 items-start`}>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember about this bill"
              className={`${inputBase} resize-none`}
            />
          </div>
        </Field>
      </Section>

      {/* bill summary */}
      <div className="overflow-hidden rounded-2xl bg-ink text-paper">
        <div className="space-y-2 px-5 pt-4 text-sm">
          <div className="flex justify-between text-gravel">
            <span>
              Subtotal
              {Number(quantity) > 0 && Number(rate) > 0 && (
                <span className="ml-2 text-xs text-gravel/70">
                  {quantity} × {money(Number(rate))}
                </span>
              )}
            </span>
            <span className="tabular-nums text-paper">{money(base)}</span>
          </div>
          {withGst && (
            <div className="flex justify-between text-gravel">
              <span>GST {gstPercent ? `(${gstPercent}%)` : ''}</span>
              <span className="tabular-nums text-paper">{money(gstAmount)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-sm font-medium">Total amount</span>
          <span className="font-display text-3xl font-bold tabular-nums text-signal">{money(total)}</span>
        </div>
      </div>
    </form>
  )
}