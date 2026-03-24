import React from 'react'
import { usePortfolio } from '../lib/api'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export function PortfolioSummary() {
  const { data, isLoading } = usePortfolio()

  if (isLoading) return <div>Loading...</div>

  const summary = data?.summary || {}
  const isPositive = summary.unrealized_pl >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm font-medium">Total Invested</p>
        <p className="text-2xl font-bold">R$ {(summary.total_invested || 0).toLocaleString('pt-BR')}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm font-medium">Current Value</p>
        <p className="text-2xl font-bold">R$ {(summary.current_value || 0).toLocaleString('pt-BR')}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm font-medium">Unrealized P&L</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          R$ {(summary.unrealized_pl || 0).toLocaleString('pt-BR')}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm font-medium">Return %</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {(summary.unrealized_pct || 0).toFixed(2)}%
        </p>
      </div>
    </div>
  )
}
