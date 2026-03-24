import React, { useState } from 'react'
import { useUploadStatement } from '../lib/api'
import { NavBar } from '../components/NavBar'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const uploadMutation = useUploadStatement()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }

  const handleSubmit = async () => {
    if (!file) return
    await uploadMutation.mutateAsync(file)
    setFile(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-8">Upload de Extrato</h1>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition"
          >
            <p className="text-lg font-semibold text-gray-700">
              Arraste um arquivo PDF ou XLSX aqui
            </p>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Arquivo selecionado:</p>
              <p className="text-blue-600">{file.name}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || uploadMutation.isPending}
            className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Processando...' : 'Enviar'}
          </button>

          {uploadMutation.isSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900">Upload realizado com sucesso!</p>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900">Erro ao processar arquivo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
