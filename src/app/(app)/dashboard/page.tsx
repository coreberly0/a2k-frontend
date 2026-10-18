'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, ShoppingCart, Receipt, Wallet, ArrowUpRight, ArrowDownRight,
  Plus, Users, Store, Contact, Truck, ChevronRight, AlertCircle, Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { money } from '@/lib/format'

type Sale = {
  id: string
  bill_no: string
  sale_date: string
  total_amount: number | string
  payment: string | null
  customer?: { name: string } | null
}
type Purchase = {
  id: string
  purchase_date: string
  total_amount: number | string
  payment: string | null
  vendor?: { name: string } | null
}
type Expense = {
  id: string
  expense_date: string
  amount: number | string
  category?: { name: string } | null
}

type Period = 'month' | '30d' | 'year' | 'all'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: '30d', label: '30 days' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ---------- helpers ---------- */

const ymd = (d: Date) => d.toLocaleDateString('en-CA') // yyyy-mm-dd in local time
const num = (v: unknown) => Number(v) || 0
const day = (v: unknown) => String(v ?? '').slice(0, 10)

const compact = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

function fmtDate(v: unknown) {
  const [y, m, d] = day(v).split('-')
  if (!y || !m || !d) return '-'
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`
}

function getRange(period: Period) {
  if (period === 'all') return null
  const today = new Date()
  const to = new Date(today)
  let from: Date
  if (period === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1)
  else if (period === 'year') from = new Date(today.getFullYear(), 0, 1)
  else {
    from = new Date(today)
    from.setDate(from.getDate() - 29)
  }
  // previous period of the same length, ending the day before `from`
  const length = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
  const prevTo = new Date(from)
  prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevFrom.getDate() - (length - 1))
  return { from: ymd(from), to: ymd(to), prevFrom: ymd(prevFrom), prevTo: ymd(prevTo) }
}

const between = (v: unknown, from: string, to: string) => {
  const d = day(v)
  return d >= from && d <= to
}

function niceMax(max: number) {
  if (max <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(max)))
  const n = max / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function groupSum<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const m = new Map<string, number>()
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) || 0) + value(r)))
  return Array.from(m.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ---------- small pieces ---------- */

function Delta({
  cur,
  prev,
  goodWhenUp = true,
  dark,
}: {
  cur: number
  prev: number | null
  goodWhenUp?: boolean
  dark?: boolean
}) {
  if (prev === null || prev === 0) return null
  const pct = ((cur - prev) / Math.abs(prev)) * 100
  const up = pct >= 0
  const good = up === goodWhenUp
  const tone = dark
    ? good ? 'bg-white/10 text-green-300' : 'bg-white/10 text-red-300'
    : good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  cur,
  prev,
  goodWhenUp,
  dark,
  hint,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number }>
  cur: number
  prev: number | null
  goodWhenUp?: boolean
  dark?: boolean
  hint?: string
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        dark ? 'bg-ink text-paper shadow-lg shadow-ink/20' : 'border border-black/5 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            dark ? 'bg-signal text-ink' : 'bg-signal/20 text-ink'
          }`}
        >
          <Icon size={20} />
        </span>
        <Delta cur={cur} prev={prev} goodWhenUp={goodWhenUp} dark={dark} />
      </div>
      <p
        className={`mt-4 text-2xl font-bold leading-none tabular-nums ${
          dark ? (cur < 0 ? 'text-red-300' : 'text-signal') : 'text-ink'
        }`}
      >
        {value}
      </p>
      <p className={`mt-1.5 text-xs ${dark ? 'text-gravel' : 'text-gravel'}`}>{label}</p>
      {hint && <p className={`mt-0.5 text-[11px] ${dark ? 'text-gravel/70' : 'text-gravel/70'}`}>{hint}</p>}
    </div>
  )
}

function Card({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-black/5 bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function BarList({ items, empty }: { items: { label: string; value: number }[]; empty: string }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-gravel">{empty}</p>
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-3.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{i.label}</span>
            <span className="shrink-0 tabular-nums text-gravel">{money(i.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full bg-signal" style={{ width: `${Math.max((i.value / max) * 100, 3)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function PaymentBadge({ p }: { p: string | null }) {
  const v = (p || '').toLowerCase()
  const cls =
    v === 'paid'
      ? 'bg-green-100 text-green-800'
      : v === 'unpaid'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-black/5 text-gravel'
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>{p || '-'}</span>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-72 rounded-lg bg-black/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-black/5" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-black/5 lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-black/5" />
      </div>
    </div>
  )
}

/* ---------- page ---------- */

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [counts, setCounts] = useState({ customers: 0, vendors: 0, drivers: 0, vehicles: 0 })
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [period, setPeriod] = useState<Period>('month')
  const [name, setName] = useState('')
  const [hello, setHello] = useState('')
  const [dateLine, setDateLine] = useState('')

  useEffect(() => {
    // greeting is set after mount so it never mismatches the server render
    const now = new Date()
    setHello(greetingFor(now.getHours()))
    setDateLine(
      now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    )
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (u?.name) setName(String(u.name).split(' ')[0])
    } catch {}

    async function load() {
      const paths = ['/sales', '/purchases', '/expenses', '/customers', '/vendors', '/drivers', '/vehicles']
      const res = await Promise.allSettled(paths.map((p) => api<any[]>(p)))
      const rows = (i: number): any[] => {
        const r = res[i]
        return r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
      }
      setFailed(res.some((r) => r.status === 'rejected'))
      setSales(rows(0))
      setPurchases(rows(1))
      setExpenses(rows(2))
      setCounts({ customers: rows(3).length, vendors: rows(4).length, drivers: rows(5).length, vehicles: rows(6).length })
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const range = getRange(period)
    const inCur = (d: unknown) => (range ? between(d, range.from, range.to) : true)
    const inPrev = (d: unknown) => (range ? between(d, range.prevFrom, range.prevTo) : false)

    const sum = <T,>(rows: T[], date: (r: T) => unknown, val: (r: T) => number, f: (d: unknown) => boolean) =>
      rows.filter((r) => f(date(r))).reduce((a, r) => a + val(r), 0)

    const s = (f: (d: unknown) => boolean) => sum(sales, (r) => r.sale_date, (r) => num(r.total_amount), f)
    const p = (f: (d: unknown) => boolean) => sum(purchases, (r) => r.purchase_date, (r) => num(r.total_amount), f)
    const e = (f: (d: unknown) => boolean) => sum(expenses, (r) => r.expense_date, (r) => num(r.amount), f)

    const cur = { sales: s(inCur), purchases: p(inCur), expenses: e(inCur) }
    const prev = range ? { sales: s(inPrev), purchases: p(inPrev), expenses: e(inPrev) } : null

    const periodSales = sales.filter((r) => inCur(r.sale_date))
    const periodExpenses = expenses.filter((r) => inCur(r.expense_date))

    // last 6 calendar months, independent of the period picker
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MONTHS[d.getMonth()],
        sales: 0,
        purchases: 0,
        expenses: 0,
      }
    })
    const slot = (k: string) => months.find((m) => m.key === k)
    sales.forEach((r) => { const m = slot(day(r.sale_date).slice(0, 7)); if (m) m.sales += num(r.total_amount) })
    purchases.forEach((r) => { const m = slot(day(r.purchase_date).slice(0, 7)); if (m) m.purchases += num(r.total_amount) })
    expenses.forEach((r) => { const m = slot(day(r.expense_date).slice(0, 7)); if (m) m.expenses += num(r.amount) })

    const unpaidSales = sales.filter((r) => (r.payment || '').toLowerCase() === 'unpaid')
    const unpaidPurchases = purchases.filter((r) => (r.payment || '').toLowerCase() === 'unpaid')

    return {
      cur,
      prev,
      profit: cur.sales - cur.purchases - cur.expenses,
      prevProfit: prev ? prev.sales - prev.purchases - prev.expenses : null,
      months,
      topCustomers: groupSum(periodSales, (r) => r.customer?.name || 'Unknown', (r) => num(r.total_amount)).slice(0, 5),
      topCategories: groupSum(periodExpenses, (r) => r.category?.name || 'Uncategorised', (r) => num(r.amount)).slice(0, 5),
      recent: [...sales].sort((a, b) => day(b.sale_date).localeCompare(day(a.sale_date))).slice(0, 5),
      receivable: unpaidSales.reduce((a, r) => a + num(r.total_amount), 0),
      receivableCount: unpaidSales.length,
      payable: unpaidPurchases.reduce((a, r) => a + num(r.total_amount), 0),
      payableCount: unpaidPurchases.length,
    }
  }, [sales, purchases, expenses, period])

  const chartTop = niceMax(Math.max(...stats.months.flatMap((m) => [m.sales, m.purchases, m.expenses]), 0))
  const pct = (v: number) => (v > 0 ? Math.max((v / chartTop) * 100, 1.5) : 0)

  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase()

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">
                {hello}
                {name ? `, ${name}` : ''}
              </h1>
              <p className="mt-1 text-sm text-gravel">{dateLine} · Here is how the business is doing.</p>
            </div>

            <div className="flex gap-1 rounded-xl border border-black/10 bg-white p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  aria-pressed={period === p.value}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    period === p.value ? 'bg-ink text-signal shadow' : 'text-gravel hover:bg-black/5 hover:text-ink'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {failed && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
              <AlertCircle size={17} className="shrink-0" />
              Some data could not be loaded, so a few numbers may be incomplete.
            </p>
          )}

          {/* stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={`Sales · ${periodLabel}`}
              value={money(stats.cur.sales)}
              icon={TrendingUp}
              cur={stats.cur.sales}
              prev={stats.prev ? stats.prev.sales : null}
            />
            <StatCard
              label={`Purchases · ${periodLabel}`}
              value={money(stats.cur.purchases)}
              icon={ShoppingCart}
              cur={stats.cur.purchases}
              prev={stats.prev ? stats.prev.purchases : null}
              goodWhenUp={false}
            />
            <StatCard
              label={`Expenses · ${periodLabel}`}
              value={money(stats.cur.expenses)}
              icon={Receipt}
              cur={stats.cur.expenses}
              prev={stats.prev ? stats.prev.expenses : null}
              goodWhenUp={false}
            />
            <StatCard
              dark
              label={`Net profit · ${periodLabel}`}
              hint="Sales − purchases − expenses"
              value={money(stats.profit)}
              icon={Wallet}
              cur={stats.profit}
              prev={stats.prevProfit}
            />
          </div>

          {/* chart + pending payments */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              title="Last 6 months"
              className="lg:col-span-2"
              action={
                <div className="flex items-center gap-4 text-xs text-gravel">
                  <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-signal" /> Sales</span>
                  <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-ink" /> Purchases</span>
                  <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-black/25" /> Expenses</span>
                </div>
              }
            >
              <div className="relative h-60 pl-12">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${i * 25}%` }}>
                    <span className="w-10 pr-2 text-right text-[10px] text-gravel">{compact((chartTop * i) / 4)}</span>
                    <span className="h-px flex-1 bg-black/5" />
                  </div>
                ))}
                <div className="relative grid h-full grid-cols-6">
                  {stats.months.map((m) => (
                    <div key={m.key} className="flex items-end justify-center gap-1">
                      <div
                        title={`${m.label} · Sales ${money(m.sales)}`}
                        className="w-3 rounded-t bg-signal sm:w-5"
                        style={{ height: `${pct(m.sales)}%` }}
                      />
                      <div
                        title={`${m.label} · Purchases ${money(m.purchases)}`}
                        className="w-3 rounded-t bg-ink sm:w-5"
                        style={{ height: `${pct(m.purchases)}%` }}
                      />
                      <div
                        title={`${m.label} · Expenses ${money(m.expenses)}`}
                        className="w-3 rounded-t bg-black/25 sm:w-5"
                        style={{ height: `${pct(m.expenses)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-6 pl-12">
                {stats.months.map((m) => (
                  <span key={m.key} className="text-center text-xs text-gravel">{m.label}</span>
                ))}
              </div>
            </Card>

            <Card title="Pending payments">
              <div className="space-y-3">
                <Link
                  href="/sales"
                  className="block rounded-xl bg-signal/15 p-4 transition hover:bg-signal/25"
                >
                  <p className="flex items-center gap-2 text-xs font-medium text-gravel">
                    <Clock size={14} /> To receive from customers
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{money(stats.receivable)}</p>
                  <p className="mt-0.5 text-xs text-gravel">
                    {stats.receivableCount} unpaid bill{stats.receivableCount === 1 ? '' : 's'}
                  </p>
                </Link>
                <Link
                  href="/purchases"
                  className="block rounded-xl bg-black/5 p-4 transition hover:bg-black/10"
                >
                  <p className="flex items-center gap-2 text-xs font-medium text-gravel">
                    <Clock size={14} /> To pay to vendors
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{money(stats.payable)}</p>
                  <p className="mt-0.5 text-xs text-gravel">
                    {stats.payableCount} unpaid purchase{stats.payableCount === 1 ? '' : 's'}
                  </p>
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-gravel/80">Counts all unpaid entries, not just the selected period.</p>
            </Card>
          </div>

          {/* recent sales + top customers */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              title="Recent sales"
              className="lg:col-span-2"
              action={
                <Link href="/sales" className="flex items-center gap-1 text-sm font-medium text-ink underline decoration-signal decoration-2 underline-offset-4 hover:text-gravel">
                  View all <ChevronRight size={15} />
                </Link>
              }
            >
              {stats.recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-gravel">No bills yet.</p>
              ) : (
                <div className="-mx-2 overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left text-sm">
                    <tbody className="divide-y divide-black/5">
                      {stats.recent.map((s) => (
                        <tr key={s.id}>
                          <td className="px-2 py-3">
                            <span className="rounded-md bg-ink px-2 py-1 text-xs font-semibold text-signal">{s.bill_no}</span>
                          </td>
                          <td className="px-2 py-3 font-medium text-ink">{s.customer?.name || '-'}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-gravel">{fmtDate(s.sale_date)}</td>
                          <td className="px-2 py-3"><PaymentBadge p={s.payment} /></td>
                          <td className="px-2 py-3 text-right font-semibold tabular-nums text-ink">{money(s.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Top customers">
              <BarList items={stats.topCustomers} empty="No sales in this period." />
            </Card>
          </div>

          {/* expenses by category + shortcuts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Where the money went" className="lg:col-span-2">
              <BarList items={stats.topCategories} empty="No expenses in this period." />
            </Card>

            <Card title="Shortcuts">
              <div className="space-y-2">
                {[
                  { href: '/sales', label: 'New bill' },
                  { href: '/purchases', label: 'New purchase' },
                  { href: '/expenses', label: 'New expense' },
                ].map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center justify-between rounded-xl bg-signal px-4 py-3 font-semibold text-ink shadow-md shadow-signal/20 transition hover:brightness-95"
                  >
                    <span className="flex items-center gap-2"><Plus size={18} /> {a.label}</span>
                    <ChevronRight size={17} />
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/5 pt-4">
                {[
                  { href: '/customers', label: 'Customers', n: counts.customers, icon: Users },
                  { href: '/vendors', label: 'Vendors', n: counts.vendors, icon: Store },
                  { href: '/drivers', label: 'Drivers', n: counts.drivers, icon: Contact },
                  { href: '/vehicles', label: 'Vehicles', n: counts.vehicles, icon: Truck },
                ].map(({ href, label, n, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 rounded-xl border border-black/5 p-3 transition hover:bg-paper"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-black/5 text-ink"><Icon size={16} /></span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-none text-ink">{n}</span>
                      <span className="block text-xs text-gravel">{label}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}