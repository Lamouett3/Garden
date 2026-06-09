import { colors, radius } from '../theme/tokens'
import { Screen, StreakBadge, PrimaryButton } from '../components/ui'
import GrowingGarden from '../components/GrowingGarden'
import PlanetaryWidget from '../components/PlanetaryWidget'
import { useStore } from '../data/store'
import { loggedDays, currentStreak, dayKey, getCyclePhase } from '../data/storage'

const CYCLE_COLORS = {
  pink: { bg: '#FDF0F3', text: '#9A3D5E', accent: '#D4537E' },
  green: { bg: colors.green.soft, text: colors.green.primaryDark, accent: colors.green.primary },
  amber: { bg: colors.amber.bg, text: colors.amber.text, accent: colors.amber.border },
  sand: { bg: colors.sand.bg, text: colors.sand.text, accent: colors.sand.faint },
}

export default function Home({ onLog, onSeeHistory, bp = 'mobile' }) {
  const { episodes, profile } = useStore()
  const days = loggedDays(episodes).size
  const streak = currentStreak(episodes)
  const today = dayKey(new Date())
  const loggedToday = episodes.some((e) => dayKey(e.createdAt) === today)
  const cyclePhase = (profile.gender === 'f' || profile.gender === 'n') ? getCyclePhase(profile) : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel apres-midi' : 'Bonsoir'
  const wide = bp === 'desktop'

  return (
    <Screen bp={bp} wide={wide}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: colors.text.soft }}>{greeting}</div>
          <div style={{ fontSize: wide ? 24 : 19, fontWeight: 700, color: colors.text.title }}>Ton jardin</div>
        </div>
        <StreakBadge>{streak} j</StreakBadge>
      </div>

      <div style={{
        background: colors.green.bg, borderRadius: radius.lg,
        padding: wide ? '28px 24px 16px' : '16px 8px 6px', marginBottom: 8,
      }}>
        <GrowingGarden days={days} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginBottom: 18 }}>
        {days === 0
          ? 'Note un premier episode pour planter ta premiere pousse'
          : `${days} jour${days > 1 ? 's' : ''} suivi${days > 1 ? 's' : ''} \u00b7 ton jardin pousse`}
      </div>

      {cyclePhase && (
        <div style={{
          background: CYCLE_COLORS[cyclePhase.color].bg, borderRadius: radius.md,
          padding: '11px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: CYCLE_COLORS[cyclePhase.color].accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9,
          }}>
            <i className={`ti ${cyclePhase.icon}`}
              style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: CYCLE_COLORS[cyclePhase.color].text }}>
              Phase {cyclePhase.label.toLowerCase()}
            </div>
            <div style={{ fontSize: 11, color: CYCLE_COLORS[cyclePhase.color].text, opacity: 0.7 }}>
              Jour {cyclePhase.day}/{cyclePhase.total} du cycle
            </div>
          </div>
        </div>
      )}

      {loggedToday && (
        <div style={{ background: colors.green.soft, borderRadius: radius.md, padding: '13px 14px', marginBottom: 12, display: 'flex', gap: 9, alignItems: 'center' }}>
          <i className="ti ti-check" style={{ color: colors.green.primaryDark, fontSize: 18 }} aria-hidden="true" />
          <span style={{ fontSize: 13, color: colors.green.primaryDark }}>Tu as deja pris soin de toi aujourd'hui.</span>
        </div>
      )}

      {profile.planetsOn && (
        <div style={{ marginBottom: 14 }}>
          <PlanetaryWidget />
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <PrimaryButton icon="ti-plus" onClick={onLog}>Noter un episode</PrimaryButton>
        </div>
        <button onClick={onSeeHistory}
          style={{
            flex: 1, border: `1.5px solid ${colors.border.soft}`,
            background: 'transparent', color: colors.text.muted, padding: 13, borderRadius: radius.lg,
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
          }}>
          <i className="ti ti-chart-bar" aria-hidden="true" /> Voir mon historique
        </button>
      </div>
    </Screen>
  )
}
