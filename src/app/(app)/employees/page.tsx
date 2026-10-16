'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api' // your fetch helper that attaches the auth token

type Employee = { id: string; full_name: string | null; email: string; role: string | null }

export default function EmployeesPage() {
  const [list, setList] = useState<Employee[]>([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'employee' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => setList(await api('/employees'))
  useEffect(() => { load().catch((e) => setError(e.message)) }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api('/employees', { method: 'POST', body: JSON.stringify(form) })
      setForm({ full_name: '', email: '', password: '', role: 'employee' })
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-display text-2xl font-bold">Employees</h1>

      <form onSubmit={submit} className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
        <input className="rounded border p-2" placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
        <input className="rounded border p-2" type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
        <input className="rounded border p-2" type="password" placeholder="Password (min 8)" minLength={8} required value={form.password} onChange={set('password')} />
        <select className="rounded border p-2" value={form.role} onChange={set('role')}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button disabled={saving} className="rounded bg-signal p-2 font-medium text-ink sm:col-span-2">
          {saving ? 'Adding…' : 'Add employee'}
        </button>
      </form>

      <ul className="divide-y rounded-md border">
        {list.map((u) => (
          <li key={u.id} className="flex justify-between p-3">
            <span>{u.full_name || u.email}</span>
            <span className="text-sm capitalize text-gravel">{u.role}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}