'use client'
import { useResource } from '@/hooks/useResource'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import RowActions from '@/components/ui/RowActions'
import MaterialForm, { Material } from '@/components/materials/MaterialForm'

export default function MaterialsPage() {
  const r = useResource<Material>('/materials')

  return (
    <div className="space-y-4">
      <PageHeader title="Materials" addLabel="Add Material" onAdd={r.openAdd} />

      {r.error && <p className="text-red-600 text-sm">{r.error}</p>}

      {r.loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DataTable<Material>
          columns={[{ header: 'Name', render: (m) => m.name }]}
          rows={r.rows}
          rowKey={(m) => m.id}
          actions={(m) => (
            <RowActions
              onEdit={() => r.openEdit(m)}
              onDelete={r.admin ? () => r.askDelete(m) : undefined}
            />
          )}
        />
      )}

      <Modal open={r.formOpen} title={r.editing ? 'Edit Material' : 'Add Material'} onClose={r.closeForm}>
        <MaterialForm
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
        title="Delete material"
        message={`Delete "${r.deleting?.name}"? This cannot be undone.`}
        busy={r.deleteBusy}
        onConfirm={r.confirmDelete}
        onCancel={r.cancelDelete}
      />
    </div>
  )
}