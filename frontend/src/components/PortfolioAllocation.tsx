import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { usePortfolio } from '../lib/api'

const TYPE_LABELS: Record<string, string> = {
  stock: 'Ações',
  fii: 'FIIs',
  bdr: 'BDRs',
  fixed_income: 'Renda Fixa',
  crypto: 'Crypto',
  international: 'Internacional',
  fund: 'Fundos',
}

const PALETTE = [
  '#4B9FFF', '#00C896', '#A78BFA', '#F59E0B',
  '#F97316', '#06B6D4', '#EC4899', '#84CC16',
  '#FB7185', '#34D399', '#60A5FA', '#FBBF24',
]

type ViewMode = 'type' | 'ticker'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, percent } = payload[0]
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</p>
      <p style={{ margin: 0, color: 'var(--accent-green)' }}>
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        {(percent * 100).toFixed(1)}%
      </p>
    </div>
  )
}

export function PortfolioAllocation() {
  const { data } = usePortfolio()
  const [viewMode, setViewMode] = useState<ViewMode>('type')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  const positions: any[] = data?.positions ?? []

  const allTypes = useMemo(() => [...new Set(positions.map((p: any) => p.asset_type))], [positions])

  const filtered = useMemo(() => {
    if (selectedTypes.size === 0) return positions
    return positions.filter((p: any) => selectedTypes.has(p.asset_type))
  }, [positions, selectedTypes])

  const chartData = useMemo(() => {
    if (viewMode === 'type') {
      const grouped: Record<string, number> = {}
      for (const p of filtered) {
        const label = TYPE_LABELS[p.asset_type] ?? p.asset_type
        grouped[label] = (grouped[label] ?? 0) + (p.current_value ?? 0)
      }
      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value)
    }
    return filtered
      .map((p: any) => ({ name: p.ticker, value: parseFloat((p.current_value ?? 0).toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [filtered, viewMode])

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  if (!positions.length) return null

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Distribuição da Carteira
        </h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['type', 'ticker'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: viewMode === mode ? 'none' : '1px solid var(--border)',
                backgroundColor: viewMode === mode ? 'var(--accent-blue)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {mode === 'type' ? 'Por Classe' : 'Por Ativo'}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter chips (only shown in ticker mode) */}
      {viewMode === 'ticker' && allTypes.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {allTypes.map(type => {
            const active = selectedTypes.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  backgroundColor: active ? 'rgba(75,159,255,0.15)' : 'transparent',
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
              >
                {TYPE_LABELS[type] ?? type}
              </button>
            )
          })}
        </div>
      )}

      {/* Chart */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ flex: '0 0 220px', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto', maxHeight: 220 }}>
          {chartData.map((entry, i) => {
            const total = chartData.reduce((s, d) => s + d.value, 0)
            const pct = total > 0 ? (entry.value / total) * 100 : 0
            return (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: PALETTE[i % PALETTE.length],
                }} />
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {entry.name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {pct.toFixed(1)}%
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                  R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
