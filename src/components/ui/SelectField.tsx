import FormField, { inputClass } from './FormField'
import type { Option } from '@/hooks/useOptions'

type Props = {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  required?: boolean
  failed?: boolean
}

export default function SelectField({ label, value, onChange, options, required, failed }: Props) {
  return (
    <FormField label={label}>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">-- {required ? 'Select' : 'None'} --</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      {failed && <p className="text-red-600 text-xs mt-1">Could not load this list</p>}
    </FormField>
  )
}