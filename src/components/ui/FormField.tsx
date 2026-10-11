import { ReactNode } from 'react'

export const inputClass = 'w-full border rounded px-3 py-2 bg-white'

export default function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      {children}
    </div>
  )
}