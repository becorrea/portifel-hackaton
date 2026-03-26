import React from 'react'
import { PortfolioSummary } from '../components/PortfolioSummary'
import { AssetTable } from '../components/AssetTable'
import { PortfolioAllocation } from '../components/PortfolioAllocation'
import { NavBar } from '../components/NavBar'
import { usePortfolio, useRefreshMarketData } from '../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const { dataUpdatedAt } = usePortfolio()
  const queryClient = useQueryClient()
  const { mutate: refresh, isPending: refreshing } = useRefreshMarketData()

  const handleRefresh = () => {
    refresh(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
    })
  }

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <NavBar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '4px',
                letterSpacing: '-0.3px',
              }}
            >
              Meu Portfólio
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              {lastUpdated
                ? `Atualizado em ${lastUpdated}`
                : 'Dados em tempo real via B3'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)',
              color: refreshing ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Atualizando...' : 'Atualizar preços'}
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ marginBottom: '32px' }}>
          <PortfolioSummary />
        </div>

        {/* Allocation Chart */}
        <div style={{ marginBottom: '32px' }}>
          <PortfolioAllocation />
        </div>

        {/* Positions Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '10px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Posições
            </h2>
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: 'var(--border)',
              }}
            />
          </div>

          <AssetTable />
        </div>
      </div>
    </div>
  )
}
