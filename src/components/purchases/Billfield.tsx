'use client'
// components/purchases/BillField.tsx
import { useRef, useState } from 'react'
import { Paperclip, FileText, Upload, X, Eye, RefreshCw } from 'lucide-react'
import { Field } from '@/components/ui/formKit'
import { checkBillFile } from '@/lib/billApi'

type Props = {
  /** file picked in this form but not uploaded yet */
  file: File | null
  onFileChange: (file: File | null) => void
  /** bill already saved on the purchase (edit mode) */
  existingName?: string | null
  onViewExisting?: () => void
  /** user pressed remove on the saved bill */
  onRemoveExisting?: () => void
  /** saved bill was marked for removal (hidden until saved) */
  removed?: boolean
  disabled?: boolean
}

export default function BillField({
  file, onFileChange, existingName, onViewExisting, onRemoveExisting, removed, disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!f) return
    const problem = checkBillFile(f)
    if (problem) return setError(problem)
    setError('')
    onFileChange(f)
  }

  const showExisting = !!existingName && !removed && !file
  const btn =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gravel transition hover:bg-black/5 hover:text-ink disabled:opacity-50'

  return (
    <Field label="Bill copy" optional>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
        onChange={pick}
        className="hidden"
        disabled={disabled}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-signal/50 bg-signal/10 px-3.5 py-3">
          <FileText size={18} className="shrink-0 text-ink" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-gravel">{(file.size / 1024).toFixed(0)} KB, uploads when you save</p>
          </div>
          <button type="button" className={btn} onClick={() => onFileChange(null)} disabled={disabled} aria-label="Remove selected file">
            <X size={15} />
          </button>
        </div>
      ) : showExisting ? (
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-paper/60 px-3.5 py-3">
          <Paperclip size={18} className="shrink-0 text-gravel" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{existingName}</p>
          <button type="button" className={btn} onClick={onViewExisting} disabled={disabled}>
            <Eye size={15} /> View
          </button>
          <button type="button" className={btn} onClick={() => inputRef.current?.click()} disabled={disabled}>
            <RefreshCw size={15} /> Replace
          </button>
          <button type="button" className={btn} onClick={onRemoveExisting} disabled={disabled} aria-label="Remove bill">
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-paper/60 px-3.5 py-5 text-sm font-medium text-gravel transition hover:border-signal hover:bg-white hover:text-ink disabled:opacity-60"
        >
          <Upload size={18} />
          {removed ? 'Bill will be removed, click to add a new one' : 'Upload bill (PDF, JPG, PNG, max 5 MB)'}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </Field>
  )
}