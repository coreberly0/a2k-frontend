'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, Eye, EyeOff,
  Users, ShieldCheck, AlertTriangle, UserRound, Mail, Lock,
  ChevronDown, Check, UserPlus, UserCog, User,
} from 'lucide-react'
import { api } from '@/lib/api'
import Modal from '@/components/ui/Modal'
import { Field, Section, FormActions, fieldBase, inputBase } from '@/components/ui/formKit'

type Employee = { id: string; full_name: string | null; email: string; role: string | null }
type FormState = { full_name: string; email: string; password: string; role: string }

const emptyForm: FormState = { full_name: '', email: '', password: '', role: 'employee' }
const EMPLOYEE_FORM_ID = 'employee-form'

const roleOptions = [
  { value: 'employee', label: 'Employee', desc: 'Can add and view day-to-day entries', icon: User },
  { value: 'admin', label: 'Admin', desc: 'Full access, including managing employees', icon: ShieldCheck },
]

function initials(u: Employee) {
  const src = (u.full_name || u.email || '?').trim()
  const parts = src.split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

/* ---------- role dropdown ----------
   The list opens in the normal flow (it pushes the content below it down),
   so it is never cut off inside the scrolling side panel. */
function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = roleOptions.find((o) => o.value === value) || roleOptions[0]
  const CurrentIcon = current.icon

  return (
    <div
      onKeyDown={(e) => {
        // Escape closes only the list, not the whole panel
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl border bg-paper/60 px-3.5 py-3 text-left transition focus:outline-none ${
          open
            ? 'border-signal bg-white ring-4 ring-signal/20'
            : 'border-black/10 hover:border-black/20 focus-visible:border-signal focus-visible:ring-4 focus-visible:ring-signal/20'
        }`}
      >
        <CurrentIcon size={18} className="shrink-0 text-gravel" />
        <span className="flex-1 text-base text-ink">{current.label}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gravel transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-lg shadow-ink/10"
        >
          {roleOptions.map((o) => {
            const Icon = o.icon
            const selected = o.value === value
            return (
              <li key={o.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    selected ? 'bg-signal/15' : 'hover:bg-paper'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      o.value === 'admin' ? 'bg-ink text-paper' : 'bg-signal/20 text-ink'
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{o.label}</span>
                    <span className="block text-xs text-gravel">{o.desc}</span>
                  </span>
                  {selected && <Check size={18} className="shrink-0 text-ink" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function EmployeesPage() {
  const [list, setList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [query, setQuery] = useState('')
  const [meId, setMeId] = useState<string | null>(null)

  // side panel state: null = closed
  const [modal, setModal] = useState<null | { mode: 'add' } | { mode: 'edit'; user: Employee }>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPw, setShowPw] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // delete confirmation
  const [toDelete, setToDelete] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    try {
      setList(await api('/employees'))
      setPageError('')
    } catch (e: any) {
      setPageError(e.message || 'Could not load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (u?.id) setMeId(String(u.id))
    } catch {}
  }, [])

  // close the delete dialog with Escape (the side panel handles its own Escape)
  useEffect(() => {
    if (!toDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) setToDelete(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toDelete, deleting])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((u) =>
      [u.full_name, u.email, u.role].some((v) => (v || '').toLowerCase().includes(q))
    )
  }, [list, query])

  const adminCount = list.filter((u) => u.role === 'admin').length

  // must stay stable, otherwise the panel steals focus from the inputs on every keystroke
  const closeModal = useCallback(() => setModal(null), [])

  function openAdd() {
    setForm(emptyForm)
    setFormError('')
    setShowPw(false)
    setModal({ mode: 'add' })
  }

  function openEdit(user: Employee) {
    setForm({
      full_name: user.full_name || '',
      email: user.email,
      password: '',
      role: user.role || 'employee',
    })
    setFormError('')
    setShowPw(false)
    setModal({ mode: 'edit', user })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    setFormError('')
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        await api('/employees', { method: 'POST', body: form })
      } else {
        // password is optional when editing: blank = keep the current one
        const { password, ...rest } = form
        await api(`/employees/${modal.user.id}`, {
          method: 'PATCH', // your backend route is router.patch('/:id')
          body: password ? { ...rest, password } : rest,
        })
      }
      setModal(null)
      await load()
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api(`/employees/${toDelete.id}`, { method: 'DELETE' })
      setToDelete(null)
      await load()
    } catch (err: any) {
      setPageError(err.message || 'Could not delete employee')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const isEdit = modal?.mode === 'edit'

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Employees</h1>
          <p className="mt-1 text-sm text-gravel">Manage who can sign in to the ledger.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add employee
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-signal/20 text-ink">
            <Users size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{list.length}</p>
            <p className="mt-1 text-xs text-gravel">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-paper">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{adminCount}</p>
            <p className="mt-1 text-xs text-gravel">Admins</p>
          </div>
        </div>
      </div>

      {pageError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {pageError}
        </p>
      )}

      {/* table card */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20 sm:max-w-xs">
            <Search size={18} className="text-gravel" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or role"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Employee</th>
                <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gravel">
                    {query ? 'No employees match your search.' : 'No employees yet. Add the first one.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => {
                  const isMe = meId === String(u.id)
                  return (
                    <tr key={u.id} className="transition hover:bg-paper/50">
                      <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-signal">
                            {initials(u)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                              {u.full_name || '—'}
                              {isMe && (
                                <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-gravel">
                                  You
                                </span>
                              )}
                            </p>
                            {/* email shown under name on mobile */}
                            <p className="truncate text-xs text-gravel sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3.5 text-gravel sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            u.role === 'admin' ? 'bg-ink text-paper' : 'bg-signal/20 text-ink'
                          }`}
                        >
                          {u.role || 'employee'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            aria-label={`Edit ${u.full_name || u.email}`}
                            className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={() => setToDelete(u)}
                            disabled={isMe}
                            title={isMe ? "You can't delete your own account" : 'Delete'}
                            aria-label={`Delete ${u.full_name || u.email}`}
                            className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gravel"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit side panel */}
      <Modal
        open={!!modal}
        title={isEdit ? 'Edit Employee' : 'Add Employee'}
        description={
          isEdit ? 'Leave password blank to keep the current one.' : 'They can sign in with this email and password.'
        }
        icon={isEdit ? <UserCog size={22} /> : <UserPlus size={22} />}
        tone={isEdit ? 'info' : 'success'}
        size="md"
        placement="right"
        onClose={closeModal}
        footer={
          <FormActions
            formId={EMPLOYEE_FORM_ID}
            saving={saving}
            onCancel={closeModal}
            label={isEdit ? 'Save changes' : 'Add employee'}
          />
        }
      >
        <form id={EMPLOYEE_FORM_ID} onSubmit={submit} className="space-y-7 text-ink">
          {formError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Section title="Employee details">
            <Field label="Full name" optional>
              <div className={`${fieldBase} border-black/10`}>
                <UserRound size={18} className="shrink-0 text-gravel" />
                <input
                  className={inputBase}
                  placeholder="e.g. Ravi Kumar"
                  value={form.full_name}
                  onChange={set('full_name')}
                />
              </div>
            </Field>

            <Field label="Role" required>
              <RoleSelect value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
            </Field>
          </Section>

          <Section title="Sign in details">
            <Field label="Email" required>
              <div className={`${fieldBase} border-black/10`}>
                <Mail size={18} className="shrink-0 text-gravel" />
                <input
                  className={inputBase}
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
            </Field>

            <Field label="Password" required={!isEdit} optional={isEdit}>
              <div className={`${fieldBase} border-black/10`}>
                <Lock size={18} className="shrink-0 text-gravel" />
                <input
                  className={inputBase}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required={!isEdit}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="rounded-md p-1 text-gravel transition hover:bg-black/5 hover:text-ink"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
          </Section>
        </form>
      </Modal>

      {/* delete confirmation */}
      {toDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Delete employee?</h2>
              <p className="mt-1 text-sm text-gravel">
                <span className="font-medium text-ink">{toDelete.full_name || toDelete.email}</span> will lose access.
                This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setToDelete(null)}
                className="flex-1 rounded-xl border border-black/10 py-2.5 font-medium text-ink transition hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}