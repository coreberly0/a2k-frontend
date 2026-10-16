'use client'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Size = 'sm' | 'md' | 'lg' | 'xl'
type Tone = 'default' | 'success' | 'info' | 'danger'

const SIZES: Record<Size, string> = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[760px]',
  xl: 'sm:max-w-[980px]',
}

const TONES: Record<Tone, string> = {
  default: 'bg-neutral-100 text-neutral-800',
  success: 'bg-emerald-100 text-emerald-700',
  info: 'bg-blue-100 text-blue-700',
  danger: 'bg-red-100 text-red-600',
}

interface ModalProps {
  open: boolean
  title: ReactNode
  onClose: () => void
  children?: ReactNode
  icon?: ReactNode
  /** Small grey text under the title */
  description?: ReactNode
  /** Colour of the icon tile */
  tone?: Tone
  footer?: ReactNode
  size?: Size
  closeOnBackdrop?: boolean
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  icon,
  description,
  tone = 'default',
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative mx-auto flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl`}
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-neutral-100 px-6 py-5 pr-16">
          {icon && (
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-tight text-neutral-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
          </div>
        </div>

        {/* Close (X) */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-neutral-600">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-2 border-t border-neutral-100 bg-neutral-50 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}