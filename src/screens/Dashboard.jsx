import { useState } from 'react'
import { colors, radius } from '../theme/tokens'
import { Screen, ScreenHeader, StreakBadge, Segmented } from '../components/ui'
import PlanetaryWidget from '../components/PlanetaryWidget'
import { useStore } from '../data/store'
import { currentStreak } from '../data/storage'
import { computeStats, buildSeries } from '../data/stats'

const BAR_COLOR = {
  calm: colors.green.leaf,
  light: colors.amber.bar,
  strong: colors.coral.barStrong,
  empty: colors.green.leafFaint,
}

function BarChart({ bars, labels, height = 96 }) {
  const max = Math.max(...bars.map((b) => b.v), 1)
  const gap = bars.length <= 7 ? 6 : 3
  const bw = Math.floor((296 - (bars.length - 1) * gap) / bars.length)
  const floorY = height - 22
  return (
    <svg viewBox={`0 0 296 ${height}`} style={{ width: '100%' }} role="img" aria-label="Historique des episodes" preserveAspectRatio="xMidYMid meet">
      <line x1="0" y1={floorY} x2="296" y2={floorY} stroke={colors.green.leafFaint} strokeWidth="1" />
      {bars.map((b, i) => {
        const h = b.v === 0 ? 4 : Math.round(8 + (b.v / max) * (floorY - 18))
        const x = i * (bw + gap)
        const fill = b.v === 0 ? BAR_COLOR.empty : BAR_COLOR[b.c]
        return (
          <g key={i}>
            <rect x={x} y={floorY - h} width={bw} height={h} rx={bw > 10 ? 5 : 3} fill={fill} />
            {labels[i] !== undefined && (
              <text x={x + bw / 2} y={height - 6} textAnchor="middle" fontSize="9" fill="#A8B5AB" fontFamily="Nunito, sans-serif">
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function LegendDot({ color, children }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {children}
    </span>
  )
}

function StatCard({ label, value, suffix }) {
  return (
    <div style={{ flex: 1, background: colors.sand.bg, borderRadius: radius.md, padding: 12 }}>
      <div style={{ fontSize: 11, color: colors.sand.text }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 600, color: colors.text.body }}>
        {value}{suffix && value !== '\u2014' && <span style={{ fontSize: 12, color: colors.sand.faint }}>{suffix}</span>}
      </div>
    </div>
  )
}

export default function Dashboard({ onLog, bp = 'mobile' }) {
  const { episodes, profile } = useStore()
  const [view, setView] = useState('s')
  const wide = bp === 'desktop'

  const streak = currentStreak(episodes)
  const stats = computeStats(episodes)
  const series = buildSeries(episodes, view)

  if (episodes.length === 0) {
    return (
      <Screen bp={bp}>
        <ScreenHeader title="Mon historique" />
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <i className="ti ti-seedling" style={{ fontSize: 40, color: colors.green.leaf }} aria-hidden="true" />
          <p style={{ fontSize: 14, color: colors.text.muted, marginTop: 14, lineHeight: 1.6 }}>
            Ton historique se remplira a mesure que tu notes tes episodes.
          </p>
          <button onClick={onLog}
            style={{
              border: 'none', background: colors.green.primary, color: '#fff',
              padding: '12px 20px', borderRadius: radius.lg, fontSize: 14, marginTop: 8,
              display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
            }}>
            <i className="ti ti-plus" aria-hidden="true" /> Noter mon premier episode
          </button>
        </div>
      </Screen>
    )
  }

  const chartBlock = (
    <>
      <Segmented
        options={[{ value: 's', label: 'Semaine' }, { value: 'm', label: 'Mois' }, { value: 'a', label: 'Annee' }]}
        value={view} onChange={setView} />
      <BarChart bars={series.bars} labels={series.labels} height={wide ? 150 : 96} />
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: colors.text.soft, margin: '6px 0 0' }}>
        <LegendDot color={colors.green.leaf}>jour calme</LegendDot>
        <LegendDot color={colors.amber.bar}>episode leger</LegendDot>
        <LegendDot color={colors.coral.barStrong}>episode fort</LegendDot>
      </div>
    </>
  )

  const statsBlock = (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="Episodes" value={String(stats.count)} />
        <StatCard label="Intensite moy." value={stats.avgIntensity} suffix="/10" />
      </div>
      {stats.topTriggers.length > 0 && (
        <div style={{ background: colors.green.soft, borderRadius: radius.md, padding: '12px 14px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <i className="ti ti-bulb" style={{ color: colors.green.primaryDark, fontSize: 17, marginTop: 1 }} aria-hidden="true" />
          <span style={{ fontSize: 12, color: colors.green.primaryDark, lineHeight: 1.5 }}>
            Ton declencheur le plus frequent : {stats.topTriggers[0].label} ({stats.topTriggers[0].count} fois).
          </span>
        </div>
      )}
    </>
  )

  return (
    <Screen bp={bp} wide={wide}>
      <ScreenHeader title="Mon historique" right={<StreakBadge>{streak} j</StreakBadge>} />
      {wide ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
          <div>{chartBlock}</div>
          <div>
            {statsBlock}
            {profile.planetsOn && (
              <div style={{ marginTop: 14 }}><PlanetaryWidget compact /></div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>{chartBlock}</div>
          {statsBlock}
          {profile.planetsOn && (
            <div style={{ marginTop: 14 }}><PlanetaryWidget compact /></div>
          )}
        </>
      )}
      <div style={{ flex: 1 }} />
    </Screen>
  )
}
