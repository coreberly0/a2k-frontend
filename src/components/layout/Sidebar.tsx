'use client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, Package, Truck, UserCog,
  UserRound, ReceiptText, ShoppingCart, Wallet, LogOut, X,
} from 'lucide-react'
import NavLink from './NavLink'
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
]

type Props = { open?: boolean; onClose?: () => void }

export default function Sidebar({ open = false, onClose }: Props) {
  const [user, setUser] = useState<User | null>(null)

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

  return (
    <>
      {/* mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/60 transition-opacity lg:hidden
          ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-paper transition-transform duration-200
          lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="hazard h-1.5 shrink-0" />

        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-signal text-ink">
              <Truck size={22} strokeWidth={2.25} />
            </div>
            <div className="leading-none">
              <p className="font-display text-2xl font-bold tracking-wide">A2K Transport</p>
              <p className="mt-1 text-xs text-gravel">Load Ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-gravel hover:text-paper focus-visible:outline-2 focus-visible:outline-signal lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-xs font-medium text-gravel">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} {...item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-steel text-sm font-semibold">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs capitalize text-gravel">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="rounded-md p-2 text-gravel transition-colors hover:bg-white/10 hover:text-signal
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