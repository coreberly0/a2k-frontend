import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

export type Option = { id: string; label: string }

export function useOptions(path: string, toLabel: (row: any) => string) {
  const [options, setOptions] = useState<Option[]>([])
  const [failed, setFailed] = useState(false)
  const labelRef = useRef(toLabel)

  useEffect(() => {
    let alive = true
    api<any[]>(path)
      .then((rows) => {
        if (alive) setOptions(rows.map((r) => ({ id: r.id, label: labelRef.current(r) })))
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [path])

  return { options, failed }
}