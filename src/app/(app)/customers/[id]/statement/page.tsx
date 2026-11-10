'use client'
// src/app/(app)/customers/[id]/statement/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Paperclip, Printer, X, BookOpen } from 'lucide-react'
import { getLedger, Ledger } from '@/lib/ledgerApi'

const fmt = (n: number) =>
  Math.abs(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const inr = (n: number) => '₹' + fmt(n)
const amt = (n: number) => (Number(n) ? fmt(n) : '')
const drcr = (n: number) => (Number(n) > 0 ? 'Dr' : Number(n) < 0 ? 'Cr' : '')
const dmy = (d: string) => String(d ?? '').slice(0, 10).split('-').reverse().join('-')

const tone = (n: number) => (Number(n) > 0 ? 'text-red-600' : Number(n) < 0 ? 'text-green-700' : 'text-ink')

export default function StatementPage() {
  const { id } = useParams<{ id: string }>()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Ledger | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getLedger(id, from, to)
      .then((l) => { if (!cancelled) setData(l) })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Could not load statement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, from, to])

  const hasFilter = !!(from || to)
  const period = hasFilter ? `${from ? dmy(from) : 'Start'} to ${to ? dmy(to) : 'Today'}` : 'All dates'

  const dateInput =
    'rounded-xl border border-black/10 bg-paper/60 px-3 py-2 text-sm text-ink outline-none transition focus:border-signal focus:bg-white focus:ring-4 focus:ring-signal/20'

  const closing = Number(data?.closing_balance) || 0

  const cards = data
    ? [
        { label: 'Opening balance', value: `${fmt(data.opening_balance)} ${drcr(data.opening_balance)}`.trim(), cls: 'text-ink' },
        { label: 'Total billed (Dr)', value: inr(data.total_debit), cls: 'text-red-600' },
        { label: 'Total received (Cr)', value: inr(data.total_credit), cls: 'text-green-700' },
        {
          label: closing > 0 ? 'Pending balance' : closing < 0 ? 'Advance paid' : 'Closing balance',
          value: `${inr(closing)} ${drcr(closing)}`.trim(),
          cls: tone(closing),
        },
      ]
    : []

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0">
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gravel transition hover:text-ink print:hidden"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      {/* header + filters (filters always stay on screen, even while loading or on error) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink print:hidden">
            <BookOpen size={22} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">{data?.customer?.name ?? 'Statement'}</h1>
            <p className="text-sm text-gravel">
              Statement of account · <span className="whitespace-nowrap">{period}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)}
            className={dateInput} aria-label="From date" />
          <span className="text-gravel">–</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)}
            className={dateInput} aria-label="To date" />
          {hasFilter && (
            <button
              onClick={() => { setFrom(''); setTo('') }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gravel transition hover:bg-black/5 hover:text-ink"
            >
              <X size={16} /> Clear
            </button>
          )}
          <button
            onClick={() => window.print()}
            disabled={!data}
            className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-black/5 disabled:opacity-50"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {!data && loading && <Loader2 className="mx-auto mt-16 animate-spin text-gravel" />}

      {data && (
        <>
          {/* summary strip */}
          <div className="grid grid-cols-2 divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white sm:grid-cols-4 sm:divide-x">
            {cards.map((c, i) => (
              <div key={c.label} className={`px-5 py-4 ${i > 1 ? 'border-t border-black/5 sm:border-t-0' : ''}`}>
                <p className="text-xs text-gravel">{c.label}</p>
                <p className={`mt-1 text-xl font-bold leading-none tabular-nums ${c.cls}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* ledger table */}
          <div
            className={`overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm transition print:overflow-visible print:border-black/20 print:shadow-none ${
              loading ? 'opacity-60' : ''
            }`}
            aria-busy={loading}
          >
            <table className="w-full min-w-[640px] text-left text-sm print:min-w-0">
              <thead className="bg-paper/70 text-xs font-semibold text-gravel">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Particulars</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                <tr className="bg-paper/40 italic text-gravel">
                  <td className="px-4 py-3" colSpan={4}>Opening balance</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {fmt(data.opening_balance)} {drcr(data.opening_balance)}
                  </td>
                </tr>

                {data.entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gravel">
                      No entries {hasFilter ? 'in this date range' : 'yet'}.
                    </td>
                  </tr>
                )}

                {data.entries.map((e, i) => (
                  <tr key={i} className="transition hover:bg-paper/50">
                    <td className="whitespace-nowrap px-4 py-3 text-gravel">{dmy(e.date)}</td>
                    <td className="px-4 py-3 text-ink">
                      {e.description}
                      {!!e.file_count && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-gravel">
                          <Paperclip size={12} /> {e.file_count}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600">{amt(e.debit)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">{amt(e.credit)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-ink">
                      {fmt(e.balance)} <span className={`text-xs ${tone(e.balance)}`}>{drcr(e.balance)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink/10 bg-paper/70 font-bold text-ink">
                  <td className="px-4 py-3.5" colSpan={2}>Total / Closing (pending)</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-red-600">{amt(data.total_debit)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-green-700">{amt(data.total_credit)}</td>
                  <td className={`whitespace-nowrap px-4 py-3.5 text-right tabular-nums ${tone(closing)}`}>
                    {fmt(closing)} {drcr(closing)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-gravel">
            Dr = customer owes you. Cr = customer paid in advance. 📎 shows how many receipt files a payment has.
          </p>
        </>
      )}
    </div>
  )
}