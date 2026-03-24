import React from 'react'
import { useAuth } from '../lib/supabase'
import Login from '../pages/Login'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Login />
  }

  return <>{children}</>
}
