'use client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, Package, Truck, UserCog,
  UserRound, ReceiptText, ShoppingCart, Wallet, LogOut,
} from 'lucide-react'
import NavLink from './NavLink'
import { getUser, logout, User } from '@/lib/auth'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ReceiptText },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/customers', label: 'Customers', icon: UserRound },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/materials', label: 'Materials', icon: Package },
  { href: '/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/drivers', label: 'Drivers', icon: UserCog },
]

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  return (
    <aside className="w-60 bg-white border-r flex flex-col">
      <div className="p-4 text-xl font-bold border-b">A2K Transport</div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <div className="p-3 border-t text-sm">
        <p className="font-medium truncate">{user?.name || user?.email}</p>
        <p className="text-gray-500 capitalize mb-2">{user?.role}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}