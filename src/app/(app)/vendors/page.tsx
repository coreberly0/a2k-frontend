'use client'
import { useResource } from '@/hooks/useResource'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import RowActions from '@/components/ui/RowActions'
import VendorForm, { Vendor } from '@/components/vendors/VendorForm'

export default function VendorsPage() {
  const r = useResource<Vendor>('/vendors')

  return (
    <div className="space-y-4">
      <PageHeader title="Vendors" addLabel="Add Vendor" onAdd={r.openAdd} />

      {r.error && <p className="text-red-600 text-sm">{r.error}</p>}

      {r.loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DataTable<Vendor>
          columns={[
            { header: 'Name', render: (v) => v.name },
            { header: 'Phone', render: (v) => v.phone || '-' },
            { header: 'GSTIN', render: (v) => v.gstin || '-' },
            { header: 'Address', render: (v) => v.address || '-' },
          ]}
          rows={r.rows}
          rowKey={(v) => v.id}
          actions={(v) => (
            <RowActions
              onEdit={() => r.openEdit(v)}
              onDelete={r.admin ? () => r.askDelete(v) : undefined}
            />
          )}
        />
      )}

      <Modal open={r.formOpen} title={r.editing ? 'Edit Vendor' : 'Add Vendor'} onClose={r.closeForm}>
        <VendorForm
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
        title="Delete vendor"
        message={`Delete "${r.deleting?.name}"? This cannot be undone.`}
        busy={r.deleteBusy}
        onConfirm={r.confirmDelete}
        onCancel={r.cancelDelete}
      />
    </div>
  )
}