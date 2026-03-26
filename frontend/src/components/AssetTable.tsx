import React, { useMemo } from 'react'
import { usePortfolio } from '../lib/api'
import { Inbox } from 'lucide-react'

const ASSET_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  stock: {
    label: 'Ação',
    color: 'var(--accent-blue)',
    bg: 'rgba(75, 159, 255, 0.12)',
    dot: 'var(--accent-blue)',
  },
  fii: {
    label: 'FII',
    color: 'var(--accent-green)',
    bg: 'rgba(0, 200, 150, 0.12)',
    dot: 'var(--accent-green)',
  },
  bdr: {
    label: 'BDR',
    color: 'var(--accent-purple)',
    bg: 'rgba(167, 139, 250, 0.12)',
    dot: 'var(--accent-purple)',
  },
  fixed_income: {
    label: 'Renda Fixa',
    color: 'var(--accent-yellow)',
    bg: 'rgba(245, 158, 11, 0.12)',
    dot: 'var(--accent-yellow)',
  },
}

function getAssetConfig(type: string) {
  return (
    ASSET_TYPE_CONFIG[type?.toLowerCase()] || {
      label: type || '-',
      color: 'var(--text-secondary)',
      bg: 'rgba(107, 114, 128, 0.12)',
      dot: 'var(--text-secondary)',
    }
  )
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '16px 20px' }}>
          <div
            className="skeleton"
            style={{ height: '14px', width: i === 0 ? '60px' : i === 1 ? '50px' : '80px' }}
          />
        </td>
      ))}
    </tr>
  )
}

export function AssetTable() {
  const { data, isLoading } = usePortfolio()

  const positions = useMemo(() => {
    const raw = data?.positions || []
    return [...raw].sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
  }, [data])

  const thStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-surface-hover)',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ ...thStyle, textAlign: 'left' }}>Ticker</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>Tipo</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Qtd</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Preço Médio</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Preço Atual</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Valor Total</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>P&amp;L (R$)</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>P&amp;L (%)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && positions.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '60px 20px',
                      gap: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Inbox size={40} strokeWidth={1} style={{ opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '15px' }}>
                      Faça upload de um extrato para começar
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              positions.map((pos: any) => {
                const plPositive = (pos.unrealized_pl || 0) >= 0
                const pctPositive = (pos.unrealized_pct || 0) >= 0
                const config = getAssetConfig(pos.asset_type)

                return (
                  <tr
                    key={pos.ticker}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s' }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'var(--bg-surface-hover)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    {/* Ticker */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: config.dot,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {pos.ticker}
                        </span>
                      </div>
                    </td>

                    {/* Tipo badge */}
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: config.color,
                          backgroundColor: config.bg,
                        }}
                      >
                        {config.label}
                      </span>
                    </td>

                    {/* Qtd */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {pos.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </td>

                    {/* Preço Médio */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      R$ {(pos.average_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Preço Atual */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      R$ {(pos.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Valor Total */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      R$ {(pos.current_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* P&L R$ */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: plPositive ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {plPositive ? '+' : ''}R$ {(pos.unrealized_pl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* P&L % */}
                    <td
                      style={{
                        padding: '14px 20px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: pctPositive ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {pctPositive ? '+' : ''}{(pos.unrealized_pct || 0).toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
