'use client'
import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

type Props = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-11 text-sm placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition'

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}