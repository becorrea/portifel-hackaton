import React, { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { DividendTimeline } from '../components/DividendTimeline'
import { useDividendTimeline, useDividends, usePortfolio } from '../lib/api'
import { TrendingUp, Calendar, Clock } from 'lucide-react'

function MetricCard({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string
  value: string
  icon: React.ReactNode
  valueColor?: string
}) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <span style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{icon}</span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 700,
          color: valueColor || 'var(--text-primary)',
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </p>
    </div>
  )
}

const PERIOD_OPTIONS = [
  { months: 6, label: '6m' },
  { months: 12, label: '12m' },
  { months: 24, label: '24m' },
]

const DIVIDEND_TYPES = ['stock', 'fii', 'fixed_income', 'crypto', 'fund']

export default function Dividends() {
  const [monthsFilter, setMonthsFilter] = useState(12)
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const { data: portfolioData } = usePortfolio()

  const tickerFilter = selectedTickers.length > 0 ? selectedTickers : undefined
  const { data: timelineData, isLoading: timelineLoading } = useDividendTimeline(monthsFilter, tickerFilter)
  const { data: summaryData } = useDividends(tickerFilter)

  // Only show tickers that could have dividends (fii, stock, fixed_income, etc.)
  const availableTickers: string[] = (portfolioData?.positions ?? [])
    .filter((p: any) => DIVIDEND_TYPES.includes(p.asset_type))
    .map((p: any) => p.ticker)
    .sort()

  const toggleTicker = (ticker: string) => {
    setSelectedTickers(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    )
  }

  const nextDividend = summaryData?.upcoming?.[0]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <NavBar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
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
            Dividendos
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Acompanhe seus dividendos e rendimentos
          </p>
        </div>

        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <MetricCard
            label="Recebido no Ano (YTD)"
            value={`R$ ${(summaryData?.total_received_ytd || 0).toFixed(2)}`}
            icon={<TrendingUp size={16} />}
            valueColor="var(--accent-green)"
          />
          <MetricCard
            label="Esperado Próximos 3m"
            value={`R$ ${(summaryData?.total_upcoming || 0).toFixed(2)}`}
            icon={<Clock size={16} />}
            valueColor="var(--accent-blue)"
          />
          <MetricCard
            label="Próximo Dividendo"
            value={
              nextDividend
                ? `${nextDividend.ticker} — R$ ${nextDividend.expected_amount.toFixed(2)}`
                : '—'
            }
            icon={<Calendar size={16} />}
          />
        </div>

        {/* Ticker Filter */}
        {availableTickers.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginRight: '4px' }}>
              Filtrar:
            </span>
            {selectedTickers.length > 0 && (
              <button
                onClick={() => setSelectedTickers([])}
                style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--accent-red)',
                  backgroundColor: 'rgba(255,77,77,0.1)',
                  color: 'var(--accent-red)',
                }}
              >
                Limpar
              </button>
            )}
            {availableTickers.map(ticker => {
              const active = selectedTickers.includes(ticker)
              return (
                <button
                  key={ticker}
                  onClick={() => toggleTicker(ticker)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    backgroundColor: active ? 'rgba(75,159,255,0.15)' : 'transparent',
                    color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {ticker}
                </button>
              )
            })}
          </div>
        )}

        {/* Period Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {PERIOD_OPTIONS.map(({ months, label }) => {
            const active = monthsFilter === months
            return (
              <button
                key={months}
                onClick={() => setMonthsFilter(months)}
                style={{
                  padding: '6px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: active ? 'none' : '1px solid var(--border)',
                  backgroundColor: active ? 'var(--accent-blue)' : 'var(--bg-surface)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
                  }
                }}
              >
                Últimos {label}
              </button>
            )
          })}
        </div>

        {/* Timeline Chart */}
        <DividendTimeline timeline={timelineData || []} loading={timelineLoading} />

        {/* Upcoming Dividends Table */}
        {summaryData?.upcoming && summaryData.upcoming.length > 0 && (
          <div
            style={{
              marginTop: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Próximos Dividendos
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Ticker', 'Ex-date', 'Cotas', 'Valor Esperado'].map((col, i) => (
                    <th
                      key={col}
                      style={{
                        padding: '10px 24px',
                        textAlign: i === 0 ? 'left' : 'right',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-surface-hover)',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryData.upcoming.map((div: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom:
                        idx < summaryData.upcoming.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'var(--bg-surface-hover)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    <td
                      style={{
                        padding: '14px 24px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                      }}
                    >
                      {div.ticker}
                    </td>
                    <td
                      style={{
                        padding: '14px 24px',
                        textAlign: 'right',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    >
                      {new Date(div.ex_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td
                      style={{
                        padding: '14px 24px',
                        textAlign: 'right',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    >
                      {div.quantity_held}
                    </td>
                    <td
                      style={{
                        padding: '14px 24px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--accent-green)',
                        fontSize: '14px',
                      }}
                    >
                      R$ {div.expected_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
