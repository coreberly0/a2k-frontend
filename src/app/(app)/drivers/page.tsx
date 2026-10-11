'use client'
import { useResource } from '@/hooks/useResource'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import RowActions from '@/components/ui/RowActions'
import DriverForm, { Driver } from '@/components/drivers/DriverForm'

export default function DriversPage() {
  const r = useResource<Driver>('/drivers')

  return (
    <div className="space-y-4">
      <PageHeader title="Drivers" addLabel="Add Driver" onAdd={r.openAdd} />

      {r.error && <p className="text-red-600 text-sm">{r.error}</p>}

      {r.loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DataTable<Driver>
          columns={[
            { header: 'Full name', render: (d) => d.full_name },
            { header: 'Phone', render: (d) => d.phone || '-' },
          ]}
          rows={r.rows}
          rowKey={(d) => d.id}
          actions={(d) => (
            <RowActions
              onEdit={() => r.openEdit(d)}
              onDelete={r.admin ? () => r.askDelete(d) : undefined}
            />
          )}
        />
      )}

      <Modal open={r.formOpen} title={r.editing ? 'Edit Driver' : 'Add Driver'} onClose={r.closeForm}>
        <DriverForm
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
        title="Delete driver"
        message={`Delete "${r.deleting?.full_name}"? This cannot be undone.`}
        busy={r.deleteBusy}
        onConfirm={r.confirmDelete}
        onCancel={r.cancelDelete}
      />
    </div>
  )
}