import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      window.location.href = '/dashboard'
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      setMessage('Conta criada! Você já pode entrar.')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => setIsSignUp(false), 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: 'var(--bg-surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '36px 32px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '28px',
          }}
        >
          <BarChart2 size={24} style={{ color: 'var(--accent-blue)' }} />
          <span
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            Portifel
          </span>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            textAlign: 'center',
            margin: '0 0 24px',
          }}
        >
          {isSignUp ? 'Criar conta' : 'Entrar na sua conta'}
        </h2>

        <form
          onSubmit={isSignUp ? handleSignUp : handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              ;(e.target as HTMLInputElement).style.borderColor = 'var(--accent-blue)'
            }}
            onBlur={(e) => {
              ;(e.target as HTMLInputElement).style.borderColor = 'var(--border)'
            }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              ;(e.target as HTMLInputElement).style.borderColor = 'var(--accent-blue)'
            }}
            onBlur={(e) => {
              ;(e.target as HTMLInputElement).style.borderColor = 'var(--border)'
            }}
          />
          {isSignUp && (
            <input
              type="password"
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
              onFocus={(e) => {
                ;(e.target as HTMLInputElement).style.borderColor = 'var(--accent-blue)'
              }}
              onBlur={(e) => {
                ;(e.target as HTMLInputElement).style.borderColor = 'var(--border)'
              }}
            />
          )}

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--accent-red)',
                padding: '10px 12px',
                backgroundColor: 'rgba(255, 77, 77, 0.08)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 77, 77, 0.2)',
              }}
            >
              {error}
            </p>
          )}
          {message && (
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--accent-green)',
                padding: '10px 12px',
                backgroundColor: 'rgba(0, 200, 150, 0.08)',
                borderRadius: '6px',
                border: '1px solid rgba(0, 200, 150, 0.2)',
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: loading ? 'var(--bg-surface-hover)' : 'var(--accent-blue)',
              color: loading ? 'var(--text-secondary)' : '#fff',
              marginTop: '4px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading
              ? isSignUp
                ? 'Criando conta...'
                : 'Entrando...'
              : isSignUp
              ? 'Criar Conta'
              : 'Entrar'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '20px',
            marginBottom: 0,
          }}
        >
          {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setMessage('')
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent-blue)',
              padding: 0,
            }}
          >
            {isSignUp ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  )
}
