'use client'
import { useMemo, useState } from 'react'
import { useResource } from '@/hooks/useResource'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import RowActions from '@/components/ui/RowActions'
import DateRangeFilter from '@/components/ui/DateRangeFilter'
import { Sale } from '@/components/sales/SaleForm'
import { money } from '@/lib/format'
import AddSale from './add'
import EditSale from './edit'

export default function SalesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const query = useMemo(() => {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [from, to])

  const r = useResource<Sale>('/sales', query)

  return (
    <div className="space-y-4">
      <PageHeader title="Sales" addLabel="Add Bill" onAdd={r.openAdd} />

      <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

      {r.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {r.error}
        </p>
      )}

      {r.loading ? (
        <p className="text-gravel">Loading...</p>
      ) : (
        <DataTable<Sale>
          columns={[
            { header: 'Bill No', render: (s) => s.bill_no },
            { header: 'Date', render: (s) => String(s.sale_date ?? '').slice(0, 10) },
            { header: 'Customer', render: (s) => s.customer?.name || '-' },
            { header: 'Material', render: (s) => s.material?.name || '-' },
            { header: 'Vehicle', render: (s) => s.vehicle?.plate_number || '-' },
            { header: 'Qty', render: (s) => s.quantity },
            { header: 'Rate', render: (s) => money(s.rate) },
            { header: 'Total', render: (s) => money(s.total_amount) },
            { header: 'Payment', render: (s) => s.payment || '-' },
          ]}
          rows={r.rows}
          rowKey={(s) => s.id}
          actions={(s) => (
            <RowActions
              onEdit={() => r.openEdit(s)}
              onDelete={() => r.askDelete(s)}
            />
          )}
        />
      )}

      {/* Add popup: open when the form is open and nothing is being edited */}
      <AddSale
        open={r.formOpen && !r.editing}
        saving={r.saving}
        error={r.formError}
        onSubmit={r.save}
        onClose={r.closeForm}
      />

      {/* Edit popup: open when the form is open and a bill is selected */}
      <EditSale
        open={r.formOpen && !!r.editing}
        sale={r.editing}
        saving={r.saving}
        error={r.formError}
        onSubmit={r.save}
        onClose={r.closeForm}
      />

      <ConfirmDialog
        open={!!r.deleting}
        title="Delete bill"
        message={`Delete bill ${r.deleting?.bill_no}? This cannot be undone.`}
        confirmLabel="Delete bill"
        busy={r.deleteBusy}
        onConfirm={r.confirmDelete}
        onCancel={r.cancelDelete}
      />
    </div>
  )
}