   'use client'
   import { useEffect, useState, ReactNode } from 'react'
   import { useRouter, usePathname } from 'next/navigation'
   import { getToken } from '@/lib/api'

   export default function AuthGuard({ children }: { children: ReactNode }) {
     const router = useRouter()
     const pathname = usePathname()
     const [ready, setReady] = useState(false)

     useEffect(() => {
       if (pathname === '/login') return
       if (!getToken()) {
         router.replace('/login')
         return
       }
       setReady(true)
     }, [router, pathname])

     if (pathname === '/login') return <>{children}</>
     if (!ready) return null
     return <>{children}</>
   }