import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TimelineItem {
  year: number
  month: number
  month_name: string
  total: number
  breakdown: Array<{ ticker: string; amount: number }>
}

interface DividendTimelineProps {
  timeline: TimelineItem[]
  loading?: boolean
}

const COLORS = [
  '#4B9FFF',
  '#00C896',
  '#A78BFA',
  '#F59E0B',
  '#FF4D4D',
  '#34D399',
  '#F472B6',
  '#60A5FA',
  '#FBBF24',
  '#818CF8',
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#1A1C22',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            style={{ margin: '3px 0', color: entry.fill, fontWeight: 500 }}
          >
            {entry.name}: R$ {Number(entry.value).toFixed(2)}
          </p>
        ))}
        <p
          style={{
            margin: '8px 0 0',
            paddingTop: '6px',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          Total: R${' '}
          {payload.reduce((s: number, e: any) => s + Number(e.value), 0).toFixed(2)}
        </p>
      </div>
    )
  }
  return null
}

export function DividendTimeline({ timeline, loading }: DividendTimelineProps) {
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '360px',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Carregando dados...
        </p>
      </div>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '360px',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Nenhum dividendo encontrado
        </p>
      </div>
    )
  }

  // All unique tickers
  const allTickers = Array.from(
    new Set(timeline.flatMap((item) => item.breakdown.map((b) => b.ticker)))
  ).sort()

  // Chart data
  const chartData = timeline.map((item) => ({
    name: `${item.month_name.slice(0, 3)} ${String(item.year).slice(2)}`,
    fullDate: `${item.month_name} ${item.year}`,
    total: item.total,
    ...Object.fromEntries(item.breakdown.map((b) => [b.ticker, b.amount])),
  }))

  const totalDividends = timeline.reduce((sum, item) => sum + item.total, 0)
  const avgMonthly = timeline.length > 0 ? totalDividends / timeline.length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Mini summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Total no Período
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--accent-green)',
            }}
          >
            R$ {totalDividends.toFixed(2)}
          </p>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Média Mensal
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--accent-blue)',
            }}
          >
            R$ {avgMonthly.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3
          style={{
            margin: '0 0 20px',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Dividendos por Mês
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', paddingTop: '12px' }}
            />
            {allTickers.map((ticker, idx) => (
              <Bar
                key={ticker}
                dataKey={ticker}
                stackId="a"
                fill={COLORS[idx % COLORS.length]}
                name={ticker}
                radius={idx === allTickers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px 0' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Detalhes por Mês
          </h3>
        </div>
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th
                  style={{
                    padding: '10px 24px',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'var(--bg-surface-hover)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mês
                </th>
                <th
                  style={{
                    padding: '10px 24px',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'var(--bg-surface-hover)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Total
                </th>
                {allTickers.map((ticker) => (
                  <th
                    key={ticker}
                    style={{
                      padding: '10px 24px',
                      textAlign: 'right',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: 'var(--bg-surface-hover)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ticker}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeline.map((item, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s' }}
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
                      padding: '12px 24px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.month_name} {item.year}
                  </td>
                  <td
                    style={{
                      padding: '12px 24px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: 'var(--accent-green)',
                    }}
                  >
                    R$ {item.total.toFixed(2)}
                  </td>
                  {allTickers.map((ticker) => {
                    const amount =
                      item.breakdown.find((b) => b.ticker === ticker)?.amount || 0
                    return (
                      <td
                        key={ticker}
                        style={{
                          padding: '12px 24px',
                          textAlign: 'right',
                          color: amount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {amount > 0 ? `R$ ${amount.toFixed(2)}` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
