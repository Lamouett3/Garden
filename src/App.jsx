import { useState } from 'react'
import { colors, font } from './theme/tokens'
import { StoreProvider } from './data/store'
import { useBreakpoint } from './theme/useBreakpoint'
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
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Logo Pousse">
      <circle cx="50" cy="50" r="50" fill="#E7EFE8" />
      <path d="M50 80 C50 64 50 52 50 40" stroke="#5A8262" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50 54 C50 41 42 31 27 29 C29 43 37 52 50 54 Z" fill="#7FB089" />
      <path d="M50 47 C50 34 58 23 73 21 C71 36 63 45 50 47 Z" fill="#9FC4A4" />
      <path d="M50 40 C50 30 50 24 50 19" stroke="#5A8262" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="15" r="9" fill="#F3C8D2" />
      <circle cx="50" cy="15" r="3.5" fill="#E9B85E" />
    </svg>
  )
}

function Screens({ tab, setTab, bp }) {
  // le rapport est large par nature ; les autres écrans restent en colonne lisible
  switch (tab) {
    case 'home': return <Home bp={bp} onLog={() => setTab('log')} onSeeHistory={() => setTab('dashboard')} />
    case 'dashboard': return <Dashboard bp={bp} onLog={() => setTab('log')} />
    case 'log': return <LogEpisode bp={bp} onBack={() => setTab('home')} onSaved={() => setTab('home')} />
    case 'report': return <MedicalReport bp={bp} />
    case 'profile': return <Profile bp={bp} />
    default: return null
  }
}

function AppInner() {
  const [tab, setTab] = useState('home')
  const { bp, isDesktop } = useBreakpoint()

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
                  }}>
                  <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
                  {t.label}
                </button>
              )
            })}
          </nav>
          <div style={{ marginTop: 'auto', padding: '0 8px', fontSize: 11, color: colors.text.faint }}>
            Tes données restent sur cet appareil.
          </div>
        </aside>

        <main style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <Screens tab={tab} setTab={setTab} bp={bp} />
          </div>
        </main>
      </div>
    )
  }

  // ---------- MOBILE & TABLETTE : barre de navigation en bas ----------
  const pagePad = bp === 'tablet' ? '32px 24px 110px' : '24px 14px 96px'
  return (
    <div style={{ minHeight: '100vh', background: '#d9e3da', fontFamily: font.family, padding: pagePad }}>
      <div style={{ maxWidth: bp === 'tablet' ? 680 : 460, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: bp === 'tablet' ? 24 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <Logo size={bp === 'tablet' ? 38 : 32} />
            <span style={{ fontSize: bp === 'tablet' ? 26 : 24, fontWeight: 700, color: colors.text.title }}>Pousse</span>
          </div>
        </header>
        <Screens tab={tab} setTab={setTab} bp={bp} />
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
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  )
}
