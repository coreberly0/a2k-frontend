'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Search, Loader2, X } from 'lucide-react'

export type Opt = { value: string; label: string }

// useOptions may give {value,label} or {id,name}; accept both
export function normalize(options: unknown): Opt[] {
  if (!Array.isArray(options)) return []
  return options.map((o: any) =>
    typeof o === 'string'
      ? { value: o, label: o }
      : { value: String(o.value ?? o.id ?? ''), label: String(o.label ?? o.name ?? o.value ?? '') }
  )
}

export const fieldBase =
  'flex items-center gap-3 rounded-xl border bg-paper/60 px-3.5 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20'
export const inputBase =
  'w-full bg-transparent py-3 text-base text-ink outline-none placeholder:text-gravel/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]'

export function Field({
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

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

/** Card section for full-screen forms: title + icon on the left, fields on the right. */
export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:grid-cols-[240px_1fr] lg:gap-10 lg:p-8">
      <div>
        <span className="mb-3 grid size-10 place-items-center rounded-xl bg-signal/20 text-ink">
          <Icon size={20} />
        </span>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {description && <p className="mt-1 text-sm text-gravel">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

/** Cancel + Submit buttons for the panel footer. The submit button targets the form by id. */
export function FormActions({
  formId,
  saving,
  onCancel,
  label,
}: {
  formId: string
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
        form={formId}
        disabled={saving}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-signal py-3 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60 sm:flex-none sm:px-8"
      >
        {saving && <Loader2 size={18} className="animate-spin" />}
        {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}

/** Dropdown list: opens above or below depending on space, searchable when long. */
export function Dropdown({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  failed,
  loading,
  required,
  error,
}: {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  value: string
  onChange: (v: string) => void
  options: Opt[]
  failed?: boolean
  loading?: boolean
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
          // Escape closes only the list, not the whole panel
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
            {current ? current.label : loading ? 'Loading…' : 'Select'}
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
                  {loading
                    ? 'Loading…'
                    : failed
                      ? "Couldn't load this list"
                      : options.length === 0
                        ? 'Nothing to choose yet'
                        : 'No match'}
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