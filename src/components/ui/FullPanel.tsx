'use client'
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  description?: string
  icon?: ReactNode
  tone?: 'success' | 'info'
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}

const TONES = {
  success: 'bg-signal/25 text-ink',
  info: 'bg-ink text-signal',
}

/** A panel that covers the whole screen, with the content using the full width. */
export default function FullPanel({
  open,
  title,
  description,
  icon,
  tone = 'success',
  onClose,
  footer,
  children,
}: Props) {
  // close with Escape, and stop the page behind from scrolling
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/* header */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] items-center gap-4 px-4 py-4 sm:px-8">
          {icon && (
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>{icon}</span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-bold text-ink">{title}</h2>
            {description && <p className="truncate text-sm text-gravel">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* body: scrolls, content spans the full width */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-8">{children}</div>
      </div>

      {/* footer */}
      {footer && (
        <footer className="border-t border-black/5 bg-white">
          <div className="mx-auto flex w-full max-w-[1800px] justify-end px-4 py-4 sm:px-8">{footer}</div>
        </footer>
      )}
    </div>
  )
}