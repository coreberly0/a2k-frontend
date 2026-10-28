'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X,
  Contact, UserCheck, FileWarning, Truck,
} from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import Modal from '@/components/ui/Modal'
import { FormActions } from '@/components/ui/formKit'
import DriverForm, { Driver, VehicleOption, DRIVER_FORM_ID } from '@/components/drivers/DriverForm'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

type LicenceState = { label: string; className: string; problem: boolean }

// days left until the licence expires (negative = already expired)
function licenceState(expiry: string | null): LicenceState | null {
  if (!expiry) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((new Date(`${expiry}T00:00:00`).getTime() - today.getTime()) / 86400000)
  const date = new Date(`${expiry}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  if (days < 0) return { label: `Expired · ${date}`, className: 'bg-red-50 text-red-700', problem: true }
  if (days <= 30) return { label: `${days}d left · ${date}`, className: 'bg-amber-50 text-amber-700', problem: true }
  return { label: date, className: 'bg-black/5 text-gravel', problem: false }
}

type Filter = 'all' | 'available' | 'unavailable'

export default function DriversPage() {
  const r = useResource<Driver>('/drivers')
  const vehicles = useResource<VehicleOption>('/vehicles')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

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
    return r.rows.filter((d) => {
      if (filter === 'available' && !d.is_available) return false
      if (filter === 'unavailable' && d.is_available) return false
      if (!q) return true
      return [d.full_name, d.phone, d.license_number, d.vehicle?.plate_number].some((v) =>
        v?.toLowerCase().includes(q)
      )
    })
  }, [r.rows, search, filter])

  const available = r.rows.filter((d) => d.is_available).length
  const licenceIssues = r.rows.filter((d) => licenceState(d.license_expiry)?.problem).length

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'unavailable', label: 'Not available' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Drivers</h1>
          <p className="mt-1 text-sm text-gravel">The people behind the wheel.</p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Driver
        </button>
      </div>

      {/* summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <Contact size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{r.rows.length}</p>
            <p className="mt-1 text-xs text-gravel">Total drivers</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-signal">
            <UserCheck size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{available}</p>
            <p className="mt-1 text-xs text-gravel">Available</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal/20 text-ink">
            <FileWarning size={22} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-ink">{licenceIssues}</p>
            <p className="mt-1 text-xs text-gravel">Licence expired / expiring in 30 days</p>
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
              placeholder="Search name, phone, licence or vehicle"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-paper/70 p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filter === f.key ? 'bg-white text-ink shadow-sm' : 'text-gravel hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(search || filter !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
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
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Licence expiry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {r.loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-gravel">
                    <Loader2 className="mx-auto animate-spin" size={22} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-gravel">
                      <Contact size={22} />
                    </span>
                    <p className="font-medium text-ink">
                      {search || filter !== 'all' ? 'No drivers match your filters' : 'No drivers yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {search || filter !== 'all'
                        ? 'Try a different search or filter.'
                        : 'Click “Add Driver” to create the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((d, i) => {
                  const lic = licenceState(d.license_expiry)
                  return (
                    <tr key={d.id} className="transition hover:bg-paper/50">
                      <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-signal">
                            {initials(d.full_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-ink">{d.full_name}</p>
                            {d.license_number && (
                              <p className="font-mono text-xs text-gravel">{d.license_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gravel">{d.phone || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {d.vehicle ? (
                          <span className="inline-flex items-center gap-1.5 text-ink">
                            <Truck size={15} className="text-gravel" />
                            <span className="font-medium">{d.vehicle.plate_number}</span>
                            {d.vehicle.type && <span className="text-xs text-gravel">{d.vehicle.type}</span>}
                          </span>
                        ) : (
                          <span className="text-gravel">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {lic ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${lic.className}`}>
                            {lic.label}
                          </span>
                        ) : (
                          <span className="text-gravel">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            d.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-black/5 text-gravel'
                          }`}
                        >
                          {d.is_available ? 'Available' : 'Not available'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => r.openEdit(d)}
                            aria-label={`Edit ${d.full_name}`}
                            className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                          >
                            <Pencil size={17} />
                          </button>
                          {/* only admins can delete */}
                          {r.admin && (
                            <button
                              onClick={() => r.askDelete(d)}
                              aria-label={`Delete ${d.full_name}`}
                              className="rounded-lg p-2 text-gravel transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
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

      {/* Add / Edit full-screen form */}
      <Modal
        open={r.formOpen}
        title={r.editing ? 'Edit Driver' : 'Add Driver'}
        description={r.editing ? 'Update the driver details' : 'Enter the driver details below'}
        icon={r.editing ? <Pencil size={20} /> : <Plus size={20} />}
        tone={r.editing ? 'info' : 'success'}
        size="xl"
        placement="full"
        onClose={r.closeForm}
        footer={
          <FormActions
            formId={DRIVER_FORM_ID}
            saving={r.saving}
            onCancel={r.closeForm}
            label={r.editing ? 'Save changes' : 'Add driver'}
          />
        }
      >
        <DriverForm
          key={r.editing?.id ?? 'new'}
          initial={r.editing}
          vehicles={vehicles.rows}
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
              <h2 className="font-display text-xl font-bold text-ink">Delete driver?</h2>
              <p className="mt-1 text-sm text-gravel">
                <span className="font-medium text-ink">{r.deleting.full_name}</span> will be removed.
                This can&apos;t be undone. If the driver is used in bills or expenses, mark them as
                not available instead.
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