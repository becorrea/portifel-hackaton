import React from 'react'
import { supabase } from '../lib/supabase'

export function NavBar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Portifel</h1>
        <button
          onClick={handleLogout}
          className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
