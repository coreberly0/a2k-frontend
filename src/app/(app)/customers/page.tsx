'use client'
// app/customers/page.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X,
  Users, Phone, FileText,
} from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import Modal from '@/components/ui/Modal'
import { FormActions } from '@/components/ui/formKit'
import CustomerForm, { Customer, CUSTOMER_FORM_ID } from '@/components/customers/CustomerForm'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

// "Chennai, Tamil Nadu, India"
function location(c: Customer) {
  return [c.city, c.state, c.country].filter(Boolean).join(', ')
}

// full address for tooltip
function fullAddress(c: Customer) {
  return [c.address, location(c), c.pincode].filter(Boolean).join(', ')
}

export default function CustomersPage() {
  const r = useResource<Customer>('/customers')
  const [search, setSearch] = useState('')

  // close the delete dialog with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && r.deleting && !r.deleteBusy) r.cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [r.deleting, r.deleteBusy, r.cancelDelete])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return r.rows
    return r.rows.filter((c) =>
      [c.name, c.phone, c.email, c.gstin, c.address, c.city, c.state, c.country, c.pincode]
        .some((v) => v?.toLowerCase().includes(q))
    )
  }, [r.rows, search])

  const withPhone = r.rows.filter((c) => c.phone).length
  const withGstin = r.rows.filter((c) => c.gstin).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Customers</h1>
          <p className="mt-1 text-sm text-gravel">People and businesses you sell to.</p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <Users size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{r.rows.length}</p>
            <p className="mt-1 text-xs text-gravel">Total customers</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-signal">
            <Phone size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{withPhone}</p>
            <p className="mt-1 text-xs text-gravel">With phone number</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <FileText size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{withGstin}</p>
            <p className="mt-1 text-xs text-gravel">With GSTIN</p>
          </div>
        </div>
      </div>

      {r.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {r.error}
        </p>
      )}

      {/* table card */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20 sm:max-w-sm">
            <Search size={18} className="shrink-0 text-gravel" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, GSTIN, city or state"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gravel transition hover:bg-black/5 hover:text-ink"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-16 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {r.loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-gravel">
                      <Users size={22} />
                    </span>
                    <p className="font-medium text-ink">
                      {search ? 'No customers match your search' : 'No customers yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {search ? 'Try a different name, phone or city.' : 'Click “Add Customer” to create the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((c, i) => (
                  <tr key={c.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-signal">
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{c.name}</p>
                          {c.email && <p className="truncate text-xs text-gravel">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{c.phone || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-gravel">{c.gstin || '-'}</td>
                    <td className="max-w-[300px] px-4 py-3.5 text-gravel" title={fullAddress(c) || undefined}>
                      {fullAddress(c) ? (
                        <>
                          {c.address && <p className="truncate">{c.address}</p>}
                          <p className="truncate text-xs">
                            {[location(c), c.pincode].filter(Boolean).join(' - ')}
                          </p>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => r.openEdit(c)}
                          aria-label={`Edit ${c.name}`}
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={17} />
                        </button>
                        {/* only admins can delete */}
                        {r.admin && (
                          <button
                            onClick={() => r.askDelete(c)}
                            aria-label={`Delete ${c.name}`}
                            className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit side panel */}
      <Modal
        open={r.formOpen}
        title={r.editing ? 'Edit Customer' : 'Add Customer'}
        description={r.editing ? 'Update the customer details' : 'Enter the customer details below'}
        icon={r.editing ? <Pencil size={20} /> : <Plus size={20} />}
        tone={r.editing ? 'info' : 'success'}
        size="md"
        placement="right"
        onClose={r.closeForm}
        footer={
          <FormActions
            formId={CUSTOMER_FORM_ID}
            saving={r.saving}
            onCancel={r.closeForm}
            label={r.editing ? 'Save changes' : 'Add customer'}
          />
        }
      >
        <CustomerForm
          key={r.editing?.id ?? 'new'}
          initial={r.editing}
          saving={r.saving}
          error={r.formError}
          onSubmit={r.save}
        />
      </Modal>

      {/* delete confirmation */}
      {r.deleting && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => !r.deleteBusy && r.cancelDelete()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Delete customer?</h2>
              <p className="mt-1 text-sm text-gravel">
                <span className="font-medium text-ink">{r.deleting.name}</span> will be removed.
                This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={r.cancelDelete}
                className="flex-1 rounded-xl border border-black/10 py-2.5 font-medium text-ink transition hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={r.confirmDelete}
                disabled={r.deleteBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {r.deleteBusy && <Loader2 size={16} className="animate-spin" />}
                {r.deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}