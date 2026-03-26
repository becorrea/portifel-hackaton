import React from 'react'
import { usePortfolio } from '../lib/api'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <div className="skeleton" style={{ height: '13px', width: '120px', marginBottom: '14px' }} />
      <div className="skeleton" style={{ height: '28px', width: '160px', marginBottom: '10px' }} />
      <div className="skeleton" style={{ height: '20px', width: '72px', borderRadius: '20px' }} />
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  icon: React.ReactNode
  valueColor?: string
}

function MetricCard({ label, value, delta, deltaPositive, icon, valueColor }: MetricCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div className="flex items-center justify-between">
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, margin: 0 }}>
          {label}
        </p>
        <span style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{icon}</span>
      </div>

      <p
        className="text-2xl font-bold"
        style={{
          color: valueColor || 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </p>

      {delta !== undefined && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '20px',
            width: 'fit-content',
            backgroundColor: deltaPositive
              ? 'rgba(0, 200, 150, 0.12)'
              : 'rgba(255, 77, 77, 0.12)',
            color: deltaPositive ? 'var(--accent-green)' : 'var(--accent-red)',
          }}
        >
          {deltaPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          {delta}
        </span>
      )}
    </div>
  )
}

export function PortfolioSummary() {
  const { data, isLoading } = usePortfolio()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const summary = data?.summary || {}
  const isPositive = (summary.unrealized_pl || 0) >= 0
  const totalInvested = summary.total_invested || 0
  const currentValue = summary.current_value || 0
  const unrealizedPL = summary.unrealized_pl || 0
  const unrealizedPct = summary.unrealized_pct || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total Investido"
        value={`R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<DollarSign size={16} />}
      />
      <MetricCard
        label="Valor Atual"
        value={`R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<DollarSign size={16} />}
        delta={totalInvested > 0 ? `${((currentValue / totalInvested - 1) * 100).toFixed(2)}% vs investido` : undefined}
        deltaPositive={currentValue >= totalInvested}
      />
      <MetricCard
        label="Lucro / Prejuízo (R$)"
        value={`${isPositive ? '+' : ''}R$ ${unrealizedPL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        valueColor={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'}
        delta={`${isPositive ? '+' : ''}${unrealizedPct.toFixed(2)}%`}
        deltaPositive={isPositive}
      />
      <MetricCard
        label="Rentabilidade (%)"
        value={`${isPositive ? '+' : ''}${unrealizedPct.toFixed(2)}%`}
        icon={<Percent size={16} />}
        valueColor={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'}
        delta={isPositive ? 'acima do custo' : 'abaixo do custo'}
        deltaPositive={isPositive}
      />
    </div>
  )
}
