'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, BookOpen, IndianRupee, X } from 'lucide-react'
import { getBalances } from '@/lib/ledgerApi'

type Row = { customer_id: string; name: string; phone: string | null; balance: number }

const inr = (n: number) =>
  '₹' + Math.abs(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function LedgerPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [onlyPending, setOnlyPending] = useState(true)

  useEffect(() => {
    getBalances()
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => setError(e?.message || 'Could not load balances'))
      .finally(() => setLoading(false))
  }, [])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (onlyPending && !(Number(r.balance) > 0)) return false
      if (!q) return true
      return [r.name, r.phone].some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, onlyPending])

  const totalPending = rows.reduce((s, r) => s + Math.max(Number(r.balance || 0), 0), 0)
  const owing = rows.filter((r) => Number(r.balance) > 0).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Ledger</h1>
        <p className="mt-1 text-sm text-gravel">What each customer still owes. Open a row for the full statement.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <IndianRupee size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{inr(totalPending)}</p>
            <p className="mt-1 text-xs text-gravel">Total pending</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{owing}</p>
            <p className="mt-1 text-xs text-gravel">Customers with pending balance</p>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20 sm:max-w-sm">
            <Search size={18} className="shrink-0 text-gravel" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or phone"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search" className="text-gravel hover:text-ink">
                <X size={16} />
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gravel">
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(e) => setOnlyPending(e.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            Only customers who owe
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="font-medium text-ink">
                      {search || onlyPending ? 'No customers to show' : 'No customers yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {onlyPending ? 'Untick “Only customers who owe” to see everyone.' : 'Try a different search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                shown.map((r, i) => {
                  const b = Number(r.balance || 0)
                  return (
                    <tr key={r.customer_id} className="transition hover:bg-paper/50">
                      <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-ink">{r.name}</td>
                      <td className="px-4 py-3.5 text-gravel">{r.phone || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">
                        {b > 0 && <span className="text-red-600">{inr(b)} Dr</span>}
                        {b < 0 && <span className="text-green-600">{inr(b)} Cr</span>}
                        {b === 0 && <span className="text-gravel">₹0.00</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <Link
                            href={`/customers/${r.customer_id}/statement`}
                            aria-label={`Statement for ${r.name}`}
                            title="Open statement"
                            className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                          >
                            <BookOpen size={17} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gravel">Dr = customer owes you. Cr = customer paid in advance.</p>
    </div>
  )
}