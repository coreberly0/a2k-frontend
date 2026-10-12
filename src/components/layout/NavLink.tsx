'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

type Props = {
  href: string
  label: string
  icon: LucideIcon
  onNavigate?: () => void
}

export default function NavLink({ href, label, icon: Icon, onNavigate }: Props) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal
        ${active ? 'bg-white/10 text-paper' : 'text-paper/65 hover:bg-white/5 hover:text-paper'}`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-signal" />
      )}
      <Icon
        size={18}
        strokeWidth={active ? 2.25 : 1.75}
        className={active ? 'text-signal' : 'text-gravel group-hover:text-paper/80'}
      />
      {label}
    </Link>
  )
}