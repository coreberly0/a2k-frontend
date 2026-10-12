'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useResource } from '@/hooks/useResource'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import RowActions from '@/components/ui/RowActions'
import CustomerForm, { Customer } from '@/components/customers/CustomerForm'

export default function CustomersPage() {
  const r = useResource<Customer>('/customers')
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return r.rows
    return r.rows.filter((c) =>
      [c.name, c.phone, c.email, c.address].some((v) => v?.toLowerCase().includes(q))
    )
  }, [r.rows, search])

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" addLabel="Add Customer" onAdd={r.openAdd} />

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gravel"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email or address"
          className="w-full rounded-md border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm outline-none
            focus:border-steel focus:ring-2 focus:ring-steel/20"
        />
      </div>

      {r.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {r.error}
        </p>
      )}

      {r.loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DataTable<Customer>
          columns={[
            { header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
            { header: 'Phone', render: (c) => c.phone || '-' },
            { header: 'Email', render: (c) => c.email || '-' },
            { header: 'Address', render: (c) => c.address || '-' },
          ]}
          rows={rows}
          rowKey={(c) => c.id}
          actions={(c) => (
            <RowActions
              onEdit={() => r.openEdit(c)}
              onDelete={r.admin ? () => r.askDelete(c) : undefined}
            />
          )}
        />
      )}

      <Modal
        open={r.formOpen}
        title={r.editing ? 'Edit Customer' : 'Add Customer'}
        onClose={r.closeForm}
      >
        <CustomerForm
          key={r.editing?.id ?? 'new'}
          initial={r.editing}
          saving={r.saving}
          error={r.formError}
          onSubmit={r.save}
          onCancel={r.closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={!!r.deleting}
        title="Delete customer"
        message={`Delete "${r.deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete customer"
        busy={r.deleteBusy}
        onConfirm={r.confirmDelete}
        onCancel={r.cancelDelete}
      />
    </div>
  )
}