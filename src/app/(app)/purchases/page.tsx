'use client'
import { useMemo, useState } from 'react'
import { useResource } from '@/hooks/useResource'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import RowActions from '@/components/ui/RowActions'
import DateRangeFilter from '@/components/ui/DateRangeFilter'
import PurchaseForm, { Purchase } from '@/components/purchases/PurchaseForm'
import { money } from '@/lib/format'

export default function PurchasesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const query = useMemo(() => {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [from, to])

  const r = useResource<Purchase>('/purchases', query)

  return (
    <div className="space-y-4">
      <PageHeader title="Purchases" addLabel="Add Purchase" onAdd={r.openAdd} />

      <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

      {r.error && <p className="text-red-600 text-sm">{r.error}</p>}

      {r.loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <DataTable<Purchase>
          columns={[
            { header: 'Date', render: (p) => String(p.purchase_date ?? '').slice(0, 10) },
            { header: 'Vendor', render: (p) => p.vendor?.name || '-' },
            { header: 'Material', render: (p) => p.material?.name || '-' },
            { header: 'Vehicle', render: (p) => p.vehicle?.plate_number || '-' },
            { header: 'Qty', render: (p) => p.quantity },
            { header: 'Rate', render: (p) => money(p.rate) },
            { header: 'Total', render: (p) => money(p.total_amount) },
            { header: 'Payment', render: (p) => p.payment || '-' },
          ]}
          rows={r.rows}
          rowKey={(p) => p.id}
          actions={(p) => (
            <RowActions
              onEdit={() => r.openEdit(p)}
              onDelete={r.admin ? () => r.askDelete(p) : undefined}
            />
          )}
        />
      )}

      <Modal open={r.formOpen} title={r.editing ? 'Edit Purchase' : 'Add Purchase'} onClose={r.closeForm}>
        <PurchaseForm
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
        title="Delete purchase"
        message="Delete this purchase? This cannot be undone."
        busy={r.deleteBusy}
        onConfirm={r.confirmDelete}
        onCancel={r.cancelDelete}
      />
    </div>
  )
}