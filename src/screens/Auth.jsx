import { useState } from 'react'
import { colors, radius, font, shadow } from '../theme/tokens'
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
        boxShadow: shadow.lg,
      }}>
        {/* Logo anime — graine → bourgeon → fleur */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <svg width="64" height="64" viewBox="10 20 100 80" role="img" aria-label="Logo Pousse" style={{ marginBottom: 10, overflow: 'visible' }}>
            <defs>
              <filter id="auth-logo-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="3" floodColor="#2E4034" floodOpacity="0.2" />
              </filter>
            </defs>
            <g filter="url(#auth-logo-shadow)">
              <circle className="logo-seed" cx="60" cy="88" r="5" fill="#8B6F47" />
              <path className="logo-stem" d="M60 92 C60 78 59 66 56 56" stroke="#3F6B49" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path className="logo-leaf-l1" d="M56 60 C50 48 38 44 26 45 C28 60 40 66 54 63 C55 62 56 61 56 60 Z" fill="#7FB089" />
              <path className="logo-leaf-l2" d="M56 60 C50 50 40 47 30 47 C34 57 43 61 53 60 Z" fill="#9FC4A4" />
              <path className="logo-leaf-r1" d="M58 52 C60 38 72 30 86 30 C85 46 73 54 59 53 C58 53 58 52 58 52 Z" fill="#5A8262" />
              <path className="logo-leaf-r2" d="M58 52 C61 40 71 34 82 33 C80 44 71 50 59 50 Z" fill="#7FB089" />
              <circle className="logo-bloom" cx="60" cy="40" r="11" fill="#F3C8D2" />
              <circle className="logo-center" cx="60" cy="40" r="4.5" fill="#E9B85E" />
            </g>
          </svg>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.text.title }}>Pousse</div>
          <div style={{ fontSize: 13, color: colors.text.soft, marginTop: 4 }}>jour apres jour</div>
        </div>

        {/* Toggle mode */}
        <div style={{ display: 'flex', background: colors.green.soft, borderRadius: radius.md, padding: 4, marginBottom: 20, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
          <button onClick={() => { setMode('login'); setError('') }}
            style={{
              flex: 1, fontSize: 13, padding: '9px 0', border: 'none', borderRadius: radius.sm,
              background: mode === 'login' ? colors.green.surface : 'transparent',
              color: mode === 'login' ? colors.text.title : colors.text.soft,
              fontWeight: mode === 'login' ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: mode === 'login' ? shadow.sm : 'none',
            }}>
            Se connecter
          </button>
          <button onClick={() => { setMode('register'); setError('') }}
            style={{
              flex: 1, fontSize: 13, padding: '9px 0', border: 'none', borderRadius: radius.sm,
              background: mode === 'register' ? colors.green.surface : 'transparent',
              color: mode === 'register' ? colors.text.title : colors.text.soft,
              fontWeight: mode === 'register' ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: mode === 'register' ? shadow.sm : 'none',
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
              boxShadow: shadow.button,
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
