import React from 'react'
import { PortfolioSummary } from '../components/PortfolioSummary'
import { AssetTable } from '../components/AssetTable'
import { NavBar } from '../components/NavBar'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meu Portfólio</h1>

        <div className="mb-8">
          <PortfolioSummary />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <AssetTable />
        </div>
      </div>
    </div>
  )
}
