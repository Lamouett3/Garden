import { useState } from 'react'
import { colors, font } from './theme/tokens'
import { StoreProvider } from './data/store'
import { useBreakpoint } from './theme/useBreakpoint'
import { getSession, logout, migrateIfNeeded, seedTestAccount, currentAccountName } from './data/auth'
import Auth from './screens/Auth'
import Home from './screens/Home'
import Dashboard from './screens/Dashboard'
import LogEpisode from './screens/LogEpisode'
import Profile from './screens/Profile'
import MedicalReport from './screens/MedicalReport'

const TABS = [
  { id: 'home', label: 'Accueil', icon: 'ti-home' },
  { id: 'dashboard', label: 'Historique', icon: 'ti-chart-bar' },
  { id: 'log', label: 'Noter', icon: 'ti-plus' },
  { id: 'report', label: 'Rapport', icon: 'ti-file-text' },
  { id: 'profile', label: 'Profil', icon: 'ti-user' },
]

function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Logo Pousse">
      <circle cx="60" cy="60" r="58" fill="#EAF1EC" />
      <path d="M60 92 C60 78 59 66 56 56" stroke="#3F6B49" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M56 60 C50 48 38 44 26 45 C28 60 40 66 54 63 C55 62 56 61 56 60 Z" fill="#7FB089" />
      <path d="M56 60 C50 50 40 47 30 47 C34 57 43 61 53 60 Z" fill="#9FC4A4" />
      <path d="M58 52 C60 38 72 30 86 30 C85 46 73 54 59 53 C58 53 58 52 58 52 Z" fill="#5A8262" />
      <path d="M58 52 C61 40 71 34 82 33 C80 44 71 50 59 50 Z" fill="#7FB089" />
      <circle cx="60" cy="40" r="11" fill="#F3C8D2" />
      <circle cx="60" cy="40" r="4.5" fill="#E9B85E" />
    </svg>
  )
}

function Screens({ tab, setTab, bp, onLogout }) {
  switch (tab) {
    case 'home': return <Home bp={bp} onLog={() => setTab('log')} onSeeHistory={() => setTab('dashboard')} />
    case 'dashboard': return <Dashboard bp={bp} onLog={() => setTab('log')} />
    case 'log': return <LogEpisode bp={bp} onBack={() => setTab('home')} onSaved={() => setTab('home')} />
    case 'report': return <MedicalReport bp={bp} />
    case 'profile': return <Profile bp={bp} onLogout={onLogout} />
    default: return null
  }
}

function AppInner({ bp, isDesktop, accountName, onLogout }) {
  const [tab, setTab] = useState('home')

  // ---------- DESKTOP : navigation latérale ----------
  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: '#d9e3da', fontFamily: font.family, display: 'flex' }}>
        <aside className="no-print" style={{
          width: 240, flexShrink: 0, background: colors.green.surface,
          borderRight: `0.5px solid ${colors.border.soft}`, padding: '28px 18px',
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
            <Logo size={36} />
            <span style={{ fontSize: 22, fontWeight: 700, color: colors.text.title }}>Pousse</span>
          </div>
          {accountName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 16,
              background: colors.green.soft, borderRadius: 10, fontSize: 13, color: colors.text.muted,
            }}>
              <i className="ti ti-user" style={{ fontSize: 15 }} aria-hidden="true" />
              {accountName}
            </div>
          )}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    border: 'none', borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                    background: active ? colors.green.soft : 'transparent',
                    color: active ? colors.green.primaryDark : colors.text.muted,
                    fontWeight: active ? 600 : 400, fontSize: 14, textAlign: 'left',
                    fontFamily: 'inherit',
                  }}>
                  <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
                  {t.label}
                </button>
              )
            })}
          </nav>
          <div style={{ marginTop: 'auto', padding: '0 8px', fontSize: 11, color: colors.text.faint }}>
            Tes donnees restent sur cet appareil.
          </div>
        </aside>

        <main style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <Screens tab={tab} setTab={setTab} bp={bp} onLogout={onLogout} />
          </div>
        </main>
      </div>
    )
  }

  // ---------- MOBILE & TABLETTE : barre de navigation en bas ----------
  const isTablet = bp === 'tablet'
  const navH = isTablet ? 68 : 62
  return (
    <div style={{
      minHeight: '100vh', background: '#d9e3da', fontFamily: font.family,
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isTablet ? '28px 24px 0' : '22px 14px 0',
        marginBottom: isTablet ? 18 : 14,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Logo size={isTablet ? 38 : 32} />
          <span style={{ fontSize: isTablet ? 26 : 24, fontWeight: 700, color: colors.text.title }}>Pousse</span>
        </div>
        {accountName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: colors.green.soft, borderRadius: 10,
            padding: '6px 11px', fontSize: 12, color: colors.text.muted,
          }}>
            <i className="ti ti-user" style={{ fontSize: 14 }} aria-hidden="true" />
            {accountName}
          </div>
        )}
      </header>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isTablet ? '0 24px' : '0 14px',
        paddingBottom: navH + 18,
        maxWidth: isTablet ? 680 : 460, width: '100%', margin: '0 auto',
      }}>
        <Screens tab={tab} setTab={setTab} bp={bp} onLogout={onLogout} />
      </div>

      <nav className="no-print" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: colors.green.surface, borderTop: `0.5px solid ${colors.border.soft}`,
        display: 'flex', justifyContent: 'center', gap: 2, padding: '8px 8px 14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: 520 }}>
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, maxWidth: 90, border: 'none', background: 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  color: active ? colors.green.primary : colors.text.soft,
                  fontWeight: active ? 600 : 400, fontSize: 11, padding: '6px 0',
                  fontFamily: 'inherit',
                }}>
                <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => {
    migrateIfNeeded()
    seedTestAccount()
    return getSession()
  })
  const { bp, isDesktop } = useBreakpoint()

  if (!session) {
    return <Auth bp={bp} onAuthenticated={() => setSession(getSession())} />
  }

  return (
    <StoreProvider key={session.accountId}>
      <AppInner
        bp={bp}
        isDesktop={isDesktop}
        accountName={currentAccountName()}
        onLogout={() => { logout(); setSession(null) }}
      />
    </StoreProvider>
  )
}
