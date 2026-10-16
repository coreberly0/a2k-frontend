'use client'
import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

type Vehicle = {
  id: string
  plate_number: string
  type?: string | null
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/vehicles')
      .then((data) => setVehicles(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load vehicles'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Vehicles</h1>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Loading...
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Plate number</th>
                <th className="px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.plate_number}</td>
                  <td className="px-4 py-3 text-gray-600">{v.type || '-'}</td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    No vehicles yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}