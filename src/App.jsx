import { useState, useCallback } from 'react'
import { colors, radius, font, shadow } from './theme/tokens'
import { StoreProvider } from './data/store'
import { useBreakpoint } from './theme/useBreakpoint'
import { getSession, logout, migrateIfNeeded, seedTestAccount, currentAccountName } from './data/auth'
import { ErrorBoundary, ToastProvider, useToast, ConfirmDialog } from './components/ui'
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
  // viewBox cadre sur la masse visuelle (feuilles + fleur + tige courte)
  return (
    <svg width={size} height={size} viewBox="20 26 80 72" role="img" aria-label="Logo Pousse" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="logo-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#2E4034" floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter="url(#logo-shadow)">
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
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleLogout = useCallback(() => setConfirmLogout(true), [])
  const doLogout = useCallback(() => { setConfirmLogout(false); onLogout() }, [onLogout])

  // ---------- DESKTOP : navigation latérale ----------
  if (isDesktop) {
    return (
      <div style={{ height: '100vh', background: '#d9e3da', fontFamily: font.family, display: 'flex', overflow: 'hidden' }}>
        <aside className="no-print" style={{
          width: 240, flexShrink: 0, background: colors.green.surface,
          borderRight: `0.5px solid ${colors.border.soft}`, padding: '28px 18px',
          display: 'flex', flexDirection: 'column', height: '100%',
          boxShadow: shadow.sidebar,
        }}>
          <div style={{ padding: '0 6px', marginBottom: 24 }}>
            <button onClick={() => setTab('home')} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Logo size={34} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.text.title, lineHeight: 1, letterSpacing: '-0.3px' }}>Pousse</div>
                <div style={{ fontSize: 9.5, color: colors.text.faint, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 2 }}>jour apres jour</div>
              </div>
            </button>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${colors.green.leafLight}, transparent)`, marginTop: 16 }} />
          </div>
          {accountName && (
            <button onClick={() => setTab('profile')} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', marginBottom: 16,
              background: colors.green.soft, borderRadius: radius.md, fontSize: 13, color: colors.text.muted,
              boxShadow: shadow.xs, border: `0.5px solid ${colors.border.soft}`,
              width: '100%', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${colors.green.leaf}, ${colors.green.primary})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-user" style={{ fontSize: 13, color: '#fff' }} aria-hidden="true" />
              </div>
              <span style={{ fontWeight: 500 }}>{accountName}</span>
            </button>
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

        <main style={{ flex: 1, padding: '40px 32px', overflowY: 'auto', height: '100%' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', minHeight: 0 }}>
            <Screens tab={tab} setTab={setTab} bp={bp} onLogout={handleLogout} />
          </div>
        </main>
        <ConfirmDialog open={confirmLogout} title="Se deconnecter ?" message="Tu pourras te reconnecter avec ton nom et mot de passe." confirmLabel="Se deconnecter" onConfirm={doLogout} onCancel={() => setConfirmLogout(false)} danger />
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
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isTablet ? '16px 24px' : '14px 16px',
        background: 'rgba(217,227,218,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: 'none',
        boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
        flexShrink: 0,
      }}>
        <button onClick={() => setTab('home')} style={{
          display: 'flex', alignItems: 'center', gap: isTablet ? 11 : 9,
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Logo size={isTablet ? 32 : 28} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: isTablet ? 19 : 17, fontWeight: 700, color: colors.text.title, lineHeight: 1, letterSpacing: '-0.3px' }}>Pousse</div>
            <div style={{ fontSize: isTablet ? 9 : 8, color: colors.text.faint, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 2 }}>jour apres jour</div>
          </div>
        </button>
        {accountName && (
          <button onClick={() => setTab('profile')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: colors.green.surface, borderRadius: radius.pill,
            padding: '5px 12px 5px 5px', fontSize: 12, color: colors.text.muted,
            boxShadow: shadow.sm, border: `0.5px solid ${colors.border.soft}`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${colors.green.leaf}, ${colors.green.primary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-user" style={{ fontSize: 12, color: '#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontWeight: 500 }}>{accountName}</span>
          </button>
        )}
      </header>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isTablet ? '16px 24px 0' : '14px 14px 0',
        paddingBottom: navH + 32,
        maxWidth: isTablet ? 680 : 460, width: '100%', margin: '0 auto',
      }}>
        <Screens tab={tab} setTab={setTab} bp={bp} onLogout={handleLogout} />
      </div>

      <ConfirmDialog open={confirmLogout} title="Se deconnecter ?" message="Tu pourras te reconnecter avec ton nom et mot de passe." confirmLabel="Se deconnecter" onConfirm={doLogout} onCancel={() => setConfirmLogout(false)} danger />

      {/* Fondu doux entre le contenu et la barre de navigation */}
      <div className="no-print" style={{
        position: 'fixed', bottom: navH, left: 0, right: 0, height: 28,
        background: `linear-gradient(to bottom, transparent, rgba(251,251,246,0.5))`,
        pointerEvents: 'none', zIndex: 50,
      }} />

      <nav className="no-print" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(251,251,246,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: 'none',
        display: 'flex', justifyContent: 'center', gap: 2, padding: '6px 8px 14px',
        boxShadow: '0 -1px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: 520 }}>
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, maxWidth: 90, border: 'none', background: 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  color: active ? colors.green.primary : colors.text.soft,
                  fontWeight: active ? 600 : 400, fontSize: 10, padding: '6px 0',
                  fontFamily: 'inherit', position: 'relative',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: active ? colors.green.soft : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .2s ease',
                }}>
                  <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
                </div>
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function AppWithStore({ session, bp, isDesktop, onLogout }) {
  const toast = useToast()
  const onStorageError = useCallback(() => {
    toast('Espace de stockage insuffisant. Tes donnees n\'ont pas pu etre sauvegardees.', 'error', 5000)
  }, [toast])

  return (
    <StoreProvider key={session.accountId} onStorageError={onStorageError}>
      <AppInner
        bp={bp}
        isDesktop={isDesktop}
        accountName={currentAccountName()}
        onLogout={onLogout}
      />
    </StoreProvider>
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
    <ErrorBoundary>
      <ToastProvider>
        <AppWithStore
          session={session}
          bp={bp}
          isDesktop={isDesktop}
          onLogout={() => { logout(); setSession(null) }}
        />
      </ToastProvider>
    </ErrorBoundary>
  )
}
