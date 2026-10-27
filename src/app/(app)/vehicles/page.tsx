'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, X,
  Truck, CheckCircle2, PauseCircle, CalendarClock,
} from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import Modal from '@/components/ui/Modal'
import { FormActions } from '@/components/ui/formKit'
import VehicleForm, { Vehicle, VEHICLE_FORM_ID } from '@/components/vehicles/VehicleForm'

type StatusFilter = 'all' | 'active' | 'inactive'

const WARN_DAYS = 30

// parse "YYYY-MM-DD" as a local date (avoids timezone shifts)
function daysLeft(date?: string | null): number | null {
  if (!date) return null
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d).getTime()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((target - today) / 86400000)
}

function fmtDate(date: string) {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function isExpiring(v: Vehicle) {
  return [v.insurance_expiry, v.tax_expiry].some((d) => {
    const n = daysLeft(d)
    return n !== null && n <= WARN_DAYS
  })
}

function ExpiryCell({ date }: { date?: string | null }) {
  const n = daysLeft(date)
  if (!date || n === null) return <span className="text-gravel">-</span>

  const tone =
    n < 0 ? 'bg-red-50 text-red-700'
    : n <= WARN_DAYS ? 'bg-amber-50 text-amber-700'
    : 'bg-emerald-50 text-emerald-700'
  const hint =
    n < 0 ? `Expired ${Math.abs(n)}d ago`
    : n === 0 ? 'Expires today'
    : n <= WARN_DAYS ? `${n}d left`
    : null

  return (
    <div className="space-y-1">
      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${tone}`}>
        {fmtDate(date)}
      </span>
      {hint && <p className="text-xs text-gravel">{hint}</p>}
    </div>
  )
}

function StatCard({
  icon, value, label, dark,
}: { icon: React.ReactNode; value: number; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl ${
          dark ? 'bg-ink text-signal' : 'bg-signal/20 text-ink'
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-xs text-gravel">{label}</p>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const r = useResource<Vehicle>('/vehicles')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  // close the delete dialog with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && r.deleting && !r.deleteBusy) r.cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [r.deleting, r.deleteBusy, r.cancelDelete])

  const isActive = (v: Vehicle) => v.is_active !== false

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return r.rows.filter((v) => {
      if (status === 'active' && !isActive(v)) return false
      if (status === 'inactive' && isActive(v)) return false
      if (!q) return true
      return [v.plate_number, v.type, v.notes].some((x) => x?.toLowerCase().includes(q))
    })
  }, [r.rows, search, status])

  const activeCount = r.rows.filter(isActive).length
  const inactiveCount = r.rows.length - activeCount
  const expiringCount = r.rows.filter((v) => isActive(v) && isExpiring(v)).length

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: r.rows.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'inactive', label: 'Inactive', count: inactiveCount },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Vehicles</h1>
          <p className="mt-1 text-sm text-gravel">
            Manage your fleet, capacity and insurance / tax renewals.
          </p>
        </div>
        <button
          onClick={r.openAdd}
          className="flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99]"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Truck size={22} />} value={r.rows.length} label="Total vehicles" />
        <StatCard icon={<CheckCircle2 size={22} />} value={activeCount} label="Active" dark />
        <StatCard icon={<PauseCircle size={22} />} value={inactiveCount} label="Inactive" />
        <StatCard
          icon={<CalendarClock size={22} />}
          value={expiringCount}
          label={`Expiring in ${WARN_DAYS} days`}
          dark
        />
      </div>

      {r.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {r.error}
        </p>
      )}

      {/* table card */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-black/10 bg-paper/60 px-3 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20 sm:max-w-xs">
            <Search size={18} className="shrink-0 text-gravel" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plate, type or notes"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gravel/60"
            />
          </div>

          <div className="inline-flex rounded-xl border border-black/10 bg-paper/60 p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                  status === f.key ? 'bg-ink text-signal' : 'text-gravel hover:text-ink'
                }`}
              >
                {f.label} <span className="opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {(search || status !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatus('all') }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gravel transition hover:bg-black/5 hover:text-ink"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper/70 text-xs font-semibold text-gravel">
              <tr>
                <th className="w-14 px-4 py-3">S.No</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Insurance expiry</th>
                <th className="px-4 py-3">Tax expiry</th>
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
                      <Truck size={22} />
                    </span>
                    <p className="font-medium text-ink">
                      {search || status !== 'all' ? 'No vehicles match your filters' : 'No vehicles yet'}
                    </p>
                    <p className="mt-1 text-sm text-gravel">
                      {search || status !== 'all'
                        ? 'Try a different search or status.'
                        : 'Click “Add Vehicle” to create the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((v, i) => (
                  <tr key={v.id} className="transition hover:bg-paper/50">
                    <td className="px-4 py-3.5 font-medium text-gravel">{i + 1}</td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-signal/20 text-ink">
                          <Truck size={18} />
                        </span>
                        <div className="min-w-0">
                          <span className="inline-block rounded-md bg-ink px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-signal">
                            {v.plate_number}
                          </span>
                          <p className="mt-1 truncate text-xs text-gravel" title={v.notes ?? undefined}>
                            {v.type || 'No type'}
                            {v.notes ? ` · ${v.notes}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-ink">
                      {v.capacity != null && v.capacity !== '' ? (
                        <>{v.capacity} <span className="text-xs font-normal text-gravel">tons</span></>
                      ) : (
                        <span className="text-gravel">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5"><ExpiryCell date={v.insurance_expiry} /></td>
                    <td className="px-4 py-3.5"><ExpiryCell date={v.tax_expiry} /></td>

                    <td className="px-4 py-3.5">
                      {isActive(v) ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-gravel">
                          <span className="h-1.5 w-1.5 rounded-full bg-gravel" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => r.openEdit(v)}
                          aria-label={`Edit ${v.plate_number}`}
                          className="rounded-lg p-2 text-gravel transition hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={17} />
                        </button>
                        {/* only admins can delete */}
                        {r.admin && (
                          <button
                            onClick={() => r.askDelete(v)}
                            aria-label={`Delete ${v.plate_number}`}
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

        {!r.loading && rows.length > 0 && (
          <div className="border-t border-black/5 bg-paper/40 px-4 py-2.5 text-xs text-gravel">
            Showing {rows.length} of {r.rows.length} vehicles
          </div>
        )}
      </div>

      {/* Add / Edit full-screen form (same as Customers) */}
      <Modal
        open={r.formOpen}
        title={r.editing ? 'Edit Vehicle' : 'Add Vehicle'}
        description={r.editing ? 'Update the vehicle details' : 'Enter the vehicle details below'}
        icon={r.editing ? <Pencil size={20} /> : <Plus size={20} />}
        tone={r.editing ? 'info' : 'success'}
        size="xl"
        placement="full"
        onClose={r.closeForm}
        footer={
          <FormActions
            formId={VEHICLE_FORM_ID}
            saving={r.saving}
            onCancel={r.closeForm}
            label={r.editing ? 'Save changes' : 'Add vehicle'}
          />
        }
      >
        <VehicleForm
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
              <h2 className="font-display text-xl font-bold text-ink">Delete vehicle?</h2>
              <p className="mt-1 text-sm text-gravel">
                <span className="font-medium text-ink">{r.deleting.plate_number}</span> will be removed.
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