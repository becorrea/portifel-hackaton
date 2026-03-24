import React from 'react'
import { usePortfolio } from '../lib/api'

export function AssetTable() {
  const { data, isLoading } = usePortfolio()

  if (isLoading) return <div className="p-8">Loading assets...</div>

  const positions = data?.positions || []

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Ticker</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Qty</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Avg Price</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Current</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">Total Value</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">P&L</th>
            <th className="px-6 py-3 text-right text-sm font-semibold">%</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {positions.map((pos) => (
            <tr key={pos.ticker} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-blue-600">{pos.ticker}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{pos.asset_type}</td>
              <td className="px-6 py-4 text-right">{pos.quantity.toFixed(2)}</td>
              <td className="px-6 py-4 text-right">R$ {(pos.average_price || 0).toLocaleString('pt-BR')}</td>
              <td className="px-6 py-4 text-right">R$ {(pos.current_price || 0).toLocaleString('pt-BR')}</td>
              <td className="px-6 py-4 text-right font-semibold">R$ {(pos.current_value || 0).toLocaleString('pt-BR')}</td>
              <td className={`px-6 py-4 text-right font-semibold ${pos.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {(pos.unrealized_pl || 0).toLocaleString('pt-BR')}
              </td>
              <td className={`px-6 py-4 text-right ${pos.unrealized_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(pos.unrealized_pct || 0).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
