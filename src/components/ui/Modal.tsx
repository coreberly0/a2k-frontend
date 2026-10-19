'use client'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** true  = every placement="right" popup opens full screen (no page edits needed)
 *  false = placement="right" opens as a side panel again */
const SIDE_PANELS_OPEN_FULL_SCREEN = true

type Size = 'sm' | 'md' | 'lg' | 'xl'
type Tone = 'default' | 'success' | 'info' | 'danger'
type Placement = 'center' | 'right' | 'full'

const CENTER_SIZES: Record<Size, string> = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[760px]',
  xl: 'sm:max-w-[980px]',
}

const DRAWER_SIZES: Record<Size, string> = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[640px]',
  xl: 'sm:max-w-[820px]',
}

// width of the content column in full-screen mode
// xl = covers the whole screen width (use 'max-w-[1600px]' to keep margins on ultra-wide monitors)
const FULL_SIZES: Record<Size, string> = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-none',
}

const TONES: Record<Tone, string> = {
  default: 'bg-paper text-ink',
  success: 'bg-signal/20 text-ink',
  info: 'bg-ink text-signal',
  danger: 'bg-red-50 text-red-600',
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
  /** 'center' = popup in the middle (default), 'right' = side panel, 'full' = full screen */
  placement?: Placement
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
  placement = 'center',
  closeOnBackdrop = true,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  // slide / fade-in animation
  const [shown, setShown] = useState(false)
  const [settled, setSettled] = useState(false)

  const mode: Placement =
    placement === 'right' && SIDE_PANELS_OPEN_FULL_SCREEN ? 'full' : placement
  const isRight = mode === 'right'
  const isFull = mode === 'full'

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) {
      setShown(false)
      setSettled(false)
      return
    }
    const raf = requestAnimationFrame(() => setShown(true))
    // once the slide finishes, drop the transform so the dropdown lists
    // inside the form (position: fixed) measure against the screen correctly
    const t = setTimeout(() => setSettled(true), 320)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [open])

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

  const overlayCls = isFull
    ? 'fixed inset-0 z-[100] bg-white'
    : isRight
      ? 'fixed inset-0 z-[100] flex justify-end bg-ink/60 backdrop-blur-sm'
      : 'fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-6'

  const panelCls = isFull
    ? `flex h-full w-full flex-col outline-none transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`
    : isRight
      ? `relative flex h-full w-full ${DRAWER_SIZES[size]} flex-col overflow-hidden bg-white shadow-2xl outline-none sm:rounded-l-2xl ${
          settled ? '' : `transition-transform duration-300 ease-out ${shown ? 'translate-x-0' : 'translate-x-full'}`
        }`
      : `relative mx-auto flex max-h-[92vh] w-full ${CENTER_SIZES[size]} flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-2xl`

  const closeIcon = (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )

  const titleBlock = (
    <>
      {icon && (
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>{icon}</div>
      )}
      <div className="min-w-0">
        <h2 id={titleId} className="font-display text-2xl font-bold leading-tight text-ink">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-gravel">{description}</p>}
      </div>
    </>
  )

  return createPortal(
    <div
      className={overlayCls}
      onMouseDown={(e) => {
        if (!isFull && closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={panelCls}
      >
        {isFull ? (
          <>
            {/* Header */}
            <div className="border-b border-black/5 px-6 py-5 lg:px-10">
              <div className={`relative mx-auto flex w-full ${FULL_SIZES[size]} items-start gap-4 pr-12`}>
                {titleBlock}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="absolute right-0 top-0 grid size-10 place-items-center rounded-lg text-gravel transition hover:bg-black/5 hover:text-ink"
                >
                  {closeIcon}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-paper/50 px-6 py-8 text-sm text-gravel lg:px-10">
              <div className={`mx-auto w-full ${FULL_SIZES[size]}`}>{children}</div>
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-black/5 bg-paper/70 px-6 py-4 lg:px-10">
                <div className={`mx-auto flex w-full ${FULL_SIZES[size]}`}>{footer}</div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-black/5 px-6 py-5 pr-16">{titleBlock}</div>

            {/* Close (X) */}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-gravel transition hover:bg-black/5 hover:text-ink"
            >
              {closeIcon}
            </button>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm text-gravel">{children}</div>

            {/* Footer */}
            {footer && <div className="flex border-t border-black/5 bg-paper/70 px-6 py-4">{footer}</div>}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}