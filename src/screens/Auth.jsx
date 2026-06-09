import { useState } from 'react'
import { colors, radius, font } from '../theme/tokens'
import { login, register, loadAccounts } from '../data/auth'

export default function Auth({ bp = 'mobile', onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const accounts = loadAccounts()
  const hasAccounts = accounts.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = mode === 'login' ? login(name, password) : register(name, password)
    if (result.ok) {
      onAuthenticated()
    } else {
      setError(result.error)
    }
  }

  const isTablet = bp === 'tablet'
  const isDesktop = bp === 'desktop'
  const cardWidth = isDesktop ? 380 : isTablet ? 360 : '100%'

  return (
    <div style={{
      minHeight: '100vh', background: colors.green.bg, fontFamily: font.family,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: cardWidth, maxWidth: 400,
        background: colors.green.surface, borderRadius: radius.card,
        padding: isDesktop ? '40px 36px' : '32px 24px',
        border: `0.5px solid ${colors.border.soft}`,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <svg width="48" height="48" viewBox="0 0 100 100" role="img" aria-label="Logo Pousse" style={{ marginBottom: 10 }}>
            <circle cx="50" cy="50" r="50" fill="#E7EFE8" />
            <path d="M50 80 C50 64 50 52 50 40" stroke="#5A8262" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M50 54 C50 41 42 31 27 29 C29 43 37 52 50 54 Z" fill="#7FB089" />
            <path d="M50 47 C50 34 58 23 73 21 C71 36 63 45 50 47 Z" fill="#9FC4A4" />
            <path d="M50 40 C50 30 50 24 50 19" stroke="#5A8262" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="15" r="9" fill="#F3C8D2" />
            <circle cx="50" cy="15" r="3.5" fill="#E9B85E" />
          </svg>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.text.title }}>Pousse</div>
          <div style={{ fontSize: 13, color: colors.text.soft, marginTop: 4 }}>jour apres jour</div>
        </div>

        {/* Toggle mode */}
        <div style={{ display: 'flex', background: colors.green.soft, borderRadius: radius.md, padding: 4, marginBottom: 20 }}>
          <button onClick={() => { setMode('login'); setError('') }}
            style={{
              flex: 1, fontSize: 13, padding: '9px 0', border: 'none', borderRadius: radius.sm,
              background: mode === 'login' ? colors.green.surface : 'transparent',
              color: mode === 'login' ? colors.text.title : colors.text.soft,
              fontWeight: mode === 'login' ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Se connecter
          </button>
          <button onClick={() => { setMode('register'); setError('') }}
            style={{
              flex: 1, fontSize: 13, padding: '9px 0', border: 'none', borderRadius: radius.sm,
              background: mode === 'register' ? colors.green.surface : 'transparent',
              color: mode === 'register' ? colors.text.title : colors.text.soft,
              fontWeight: mode === 'register' ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Creer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, color: colors.text.muted, marginBottom: 6 }}>Nom</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={mode === 'login' ? 'Ton nom de compte' : 'Choisis un nom'}
            autoComplete="username"
            style={{
              width: '100%', padding: '11px 13px', fontSize: 14, fontFamily: 'inherit',
              border: `1.5px solid ${colors.border.soft}`, borderRadius: radius.sm,
              background: colors.green.surface, color: colors.text.body,
              marginBottom: 14, boxSizing: 'border-box',
            }} />

          <label style={{ display: 'block', fontSize: 13, color: colors.text.muted, marginBottom: 6 }}>Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={{
              width: '100%', padding: '11px 13px', fontSize: 14, fontFamily: 'inherit',
              border: `1.5px solid ${colors.border.soft}`, borderRadius: radius.sm,
              background: colors.green.surface, color: colors.text.body,
              marginBottom: 18, boxSizing: 'border-box',
            }} />

          {error && (
            <div style={{
              background: '#FDF0F3', color: '#9A3D5E', fontSize: 13,
              padding: '9px 13px', borderRadius: radius.sm, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 15 }} aria-hidden="true" />
              {error}
            </div>
          )}

          <button type="submit"
            style={{
              width: '100%', border: 'none', background: colors.green.primary,
              color: '#fff', padding: 14, borderRadius: radius.lg, fontSize: 14,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
            <i className={`ti ${mode === 'login' ? 'ti-login' : 'ti-user-plus'}`} aria-hidden="true" />
            {mode === 'login' ? 'Se connecter' : 'Creer mon compte'}
          </button>
        </form>

        {hasAccounts && mode === 'login' && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: colors.text.faint }}>
            {accounts.length} compte{accounts.length > 1 ? 's' : ''} sur cet appareil
          </div>
        )}
      </div>
    </div>
  )
}
