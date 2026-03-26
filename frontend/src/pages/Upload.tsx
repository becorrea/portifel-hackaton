import React, { useState } from 'react'
import { useUploadStatement, useStatement } from '../lib/api'
import { NavBar } from '../components/NavBar'
import { UploadCloud, FileText, CheckCircle, XCircle, X, Loader2 } from 'lucide-react'

function fmt(val: number | null | undefined) {
  if (val == null) return '—'
  return `R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const uploadMutation = useUploadStatement()
  const statementId = (uploadMutation.data as any)?.statement_id ?? null
  const { data: statementData } = useStatement(statementId)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isProcessing = statementData?.status === 'pending' || statementData?.status === 'processing'
  const isDone = statementData?.status === 'done'
  const summary = statementData?.raw_ai_output?.summary

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleSubmit = async () => {
    if (!file) return
    await uploadMutation.mutateAsync(file)
    setFile(null)
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <NavBar />

      <div className="max-w-2xl mx-auto px-6 py-12">
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
            Upload de Extrato
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Envie seu extrato da B3 para atualizar seu portfólio
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClickUpload}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '52px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragging ? 'rgba(75, 159, 255, 0.05)' : 'transparent',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!dragging) {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-blue)'
                ;(e.currentTarget as HTMLDivElement).style.backgroundColor =
                  'rgba(75, 159, 255, 0.03)'
              }
            }}
            onMouseLeave={(e) => {
              if (!dragging) {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
              }
            }}
          >
            <UploadCloud
              size={44}
              strokeWidth={1.5}
              style={{
                margin: '0 auto 16px',
                color: dragging ? 'var(--accent-blue)' : 'var(--text-secondary)',
                transition: 'color 0.2s',
              }}
            />
            <p
              style={{
                margin: '0 0 6px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Arraste um arquivo ou{' '}
              <span style={{ color: 'var(--accent-blue)' }}>clique para selecionar</span>
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              PDF ou XLSX — até 10 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </div>

          {/* Selected file */}
          {file && (
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-surface-hover)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <FileText size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                  display: 'flex',
                }}
                title="Remover arquivo"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!file || uploadMutation.isPending}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '13px',
              borderRadius: '8px',
              border: 'none',
              cursor: !file || uploadMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              backgroundColor:
                !file || uploadMutation.isPending
                  ? 'var(--bg-surface-hover)'
                  : 'var(--accent-blue)',
              color:
                !file || uploadMutation.isPending ? 'var(--text-secondary)' : '#fff',
              transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            {uploadMutation.isPending ? 'Processando...' : 'Enviar Extrato'}
          </button>

          {/* Processing State */}
          {uploadMutation.isSuccess && isProcessing && (
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(75, 159, 255, 0.08)',
                border: '1px solid rgba(75, 159, 255, 0.25)',
                borderRadius: '10px',
              }}
            >
              <Loader2 size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--accent-blue)' }}>
                Analisando extrato com IA...
              </p>
            </div>
          )}

          {/* Success State */}
          {uploadMutation.isSuccess && isDone && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 200, 150, 0.08)',
                  border: '1px solid rgba(0, 200, 150, 0.25)',
                  borderRadius: '10px',
                }}
              >
                <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--accent-green)' }}>
                  Extrato processado com sucesso!
                </p>
              </div>

              {/* Financial Summary Card */}
              {summary && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Resumo Financeiro
                    </p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        { label: 'Saldo Anterior', value: summary.saldo_anterior },
                        { label: 'Aplicações', value: summary.aplicacoes, positive: true },
                        { label: 'Resgates', value: summary.resgates, negative: true },
                        { label: 'Rendimentos', value: summary.rendimento, positive: true },
                        { label: 'IR / IOF', value: summary.ir_iof, negative: true },
                        { label: 'Saldo Atual', value: summary.saldo_atual, bold: true },
                        { label: 'Saldo Líquido', value: summary.saldo_liquido, bold: true },
                      ].map(({ label, value, positive, negative, bold }) => (
                        <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {label}
                          </td>
                          <td style={{
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: bold ? 600 : 400,
                            textAlign: 'right',
                            color: positive ? 'var(--accent-green)' : negative ? 'var(--accent-red)' : 'var(--text-primary)',
                          }}>
                            {negative && value ? '−' : ''}{fmt(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {uploadMutation.isError && (
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(255, 77, 77, 0.08)',
                border: '1px solid rgba(255, 77, 77, 0.25)',
                borderRadius: '10px',
              }}
            >
              <XCircle
                size={18}
                style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: '1px' }}
              />
              <div>
                <p
                  style={{
                    margin: '0 0 2px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--accent-red)',
                  }}
                >
                  Erro ao processar arquivo
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Verifique o formato do arquivo e tente novamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
