'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, Truck, UserCog,
  UserRound, ReceiptText, ShoppingCart, Wallet, LogOut, X, ShieldUser,
} from 'lucide-react'
import { getUser, logout, User } from '@/lib/auth'

const GROUPS = [
  {
    title: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Money',
    items: [
      { href: '/sales', label: 'Sales', icon: ReceiptText },
      { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
      { href: '/expenses', label: 'Expenses', icon: Wallet },
    ],
  },
  {
    title: 'People',
    items: [
      { href: '/customers', label: 'Customers', icon: UserRound },
      { href: '/vendors', label: 'Vendors', icon: Users },
      { href: '/drivers', label: 'Drivers', icon: UserCog },
    ],
  },
  {
    title: 'Stock and fleet',
    items: [
      { href: '/materials', label: 'Materials', icon: Package },
      { href: '/vehicles', label: 'Vehicles', icon: Truck },
    ],
  },
  {
    title: 'Admin',
    adminOnly: true,
    items: [{ href: '/employees', label: 'Employees', icon: ShieldUser }],
  },
]

type Props = { open?: boolean; onClose?: () => void }

export default function Sidebar({ open = false, onClose }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setUser(getUser())
  }, [])

  const displayName = user?.name || user?.email || ''
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  const visibleGroups = GROUPS.filter((g) => !g.adminOnly || user?.role === 'admin')

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/70 backdrop-blur-sm transition-opacity lg:hidden
          ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-paper shadow-2xl
          transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="hazard h-1.5 shrink-0" />

        {/* brand */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-signal text-ink shadow-lg shadow-signal/20">
              <Truck size={24} strokeWidth={2.25} />
            </div>
            <div className="leading-none">
              <p className="font-display text-xl font-bold tracking-wide">A2K Transport</p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-widest text-gravel">
                Load Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-gravel transition-colors hover:bg-white/10 hover:text-paper
              focus-visible:outline-2 focus-visible:outline-signal lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* navigation (scrollbar hidden) */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-gravel/70">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                        transition-all focus-visible:outline-2 focus-visible:outline-signal
                        ${active
                          ? 'bg-white/10 text-paper'
                          : 'text-gravel hover:bg-white/5 hover:text-paper'}`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-signal" />
                      )}
                      <Icon
                        size={19}
                        className={`shrink-0 transition-colors ${
                          active ? 'text-signal' : 'group-hover:text-signal'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* user card */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal text-sm font-bold text-ink">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="mt-0.5 truncate text-xs capitalize text-gravel">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-2 text-gravel transition-colors hover:bg-white/10 hover:text-signal
                focus-visible:outline-2 focus-visible:outline-signal"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}