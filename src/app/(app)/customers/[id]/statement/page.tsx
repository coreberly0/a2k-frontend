'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getLedger, Ledger } from '@/lib/ledgerApi'

const num = (n: number) =>
  n ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
const bal = (n: number) =>
  `${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${n > 0 ? 'Dr' : n < 0 ? 'Cr' : ''}`
const dmy = (d: string) => d.split('-').reverse().join('-')

export default function StatementPage() {
  const { id } = useParams<{ id: string }>()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Ledger | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(null)
    getLedger(id, from, to).then(setData).catch((e) => setError(e?.message || 'Could not load statement'))
  }, [id, from, to])

  if (error) return <p className="p-6 text-red-700">{error}</p>
  if (!data) return <Loader2 className="mx-auto mt-16 animate-spin text-gravel" />

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{data.customer.name}</h1>
          <p className="text-sm text-gravel">Statement of account</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-black/10 bg-paper/60 px-3 py-2 text-sm" aria-label="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-black/10 bg-paper/60 px-3 py-2 text-sm" aria-label="To date" />
          <button onClick={() => window.print()}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5">
            Print
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
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
            <tr className="italic text-gravel">
              <td className="px-4 py-3" colSpan={4}>Opening balance</td>
              <td className="px-4 py-3 text-right">{bal(data.opening_balance)}</td>
            </tr>
            {data.entries.map((e, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap px-4 py-3 text-gravel">{dmy(e.date)}</td>
                <td className="px-4 py-3">
                  {e.description}
                  {!!e.file_count && <span className="text-gravel"> 📎{e.file_count}</span>}
                </td>
                <td className="px-4 py-3 text-right text-red-600">{num(e.debit)}</td>
                <td className="px-4 py-3 text-right text-green-600">{num(e.credit)}</td>
                <td className="px-4 py-3 text-right font-medium text-ink">{bal(e.balance)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-black/10 font-bold">
              <td className="px-4 py-3" colSpan={2}>Total / Closing (pending)</td>
              <td className="px-4 py-3 text-right text-red-600">{num(data.total_debit)}</td>
              <td className="px-4 py-3 text-right text-green-600">{num(data.total_credit)}</td>
              <td className="px-4 py-3 text-right">{bal(data.closing_balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gravel">Dr = customer owes you. Cr = customer paid in advance.</p>
    </div>
  )
}