import { colors, radius } from '../theme/tokens'
import { Screen, StreakBadge, PrimaryButton } from '../components/ui'
import GrowingGarden from '../components/GrowingGarden'
import { useStore } from '../data/store'
import { loggedDays, currentStreak, dayKey } from '../data/storage'

export default function Home({ onLog, onSeeHistory, bp = 'mobile' }) {
  const { episodes } = useStore()
  const days = loggedDays(episodes).size
  const streak = currentStreak(episodes)
  const today = dayKey(new Date())
  const loggedToday = episodes.some((e) => dayKey(e.createdAt) === today)

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

      {loggedToday && (
        <div style={{ background: colors.green.soft, borderRadius: radius.md, padding: '13px 14px', marginBottom: 12, display: 'flex', gap: 9, alignItems: 'center' }}>
          <i className="ti ti-check" style={{ color: colors.green.primaryDark, fontSize: 18 }} aria-hidden="true" />
          <span style={{ fontSize: 13, color: colors.green.primaryDark }}>Tu as deja pris soin de toi aujourd'hui.</span>
        </div>
      )}

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
