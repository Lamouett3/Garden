import { useState } from 'react'
import { colors, radius } from '../theme/tokens'
import { Screen, ScreenHeader, StreakBadge, Segmented, AnimatedNumber } from '../components/ui'
import PlanetaryWidget from '../components/PlanetaryWidget'
import { useStore } from '../data/store'
import { currentStreak } from '../data/storage'
import { computeStats, buildSeries, buildDaySeries, filterByPeriod, periodLabel, withoutBienetre, formatHour } from '../data/stats'
import { conditions } from '../data/conditions'
import { getMoonPhase, getMoonPhaseName, getPlanetPositions } from '../data/astro'

const ZODIAC = [
  'Bel', 'Tau', 'Gem', 'Can', 'Lio', 'Vie',
  'Bal', 'Sco', 'Sag', 'Cap', 'Ver', 'Poi',
]
function zodiacAbbr(angle) {
  return ZODIAC[Math.floor(((angle % 360) + 360) % 360 / 30)]
}

const PLANET_DOT_COLORS = {
  mercure: '#B8AFA0', venus: '#C4963C', mars: '#D06050',
  jupiter: '#9A7E50', saturne: '#C4B17C',
}

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
            <rect x={x} y={floorY - h} width={bw} height={h} rx={bw > 10 ? 5 : 3} fill={fill}
              style={{ transformOrigin: `${x + bw / 2}px ${floorY}px`, animation: `barGrow .5s cubic-bezier(.34,1.56,.64,1) ${i * 0.06}s both` }} />
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

const INTENSITY_COLOR = (v) => v <= 4 ? colors.green.leaf : v <= 7 ? colors.amber.bar : colors.coral.barStrong

function EpisodeList({ episodes, showMoon, showPlanets }) {
  if (episodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 10px' }}>
        <i className="ti ti-calendar-event" style={{ fontSize: 30, color: colors.green.leafLight }} aria-hidden="true" />
        <p style={{ fontSize: 13, color: colors.text.muted, marginTop: 10 }}>Aucun episode sur cette periode</p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {episodes.map((ep, i) => {
        const condLabel = conditions[ep.condition]?.label || ep.condition
        const hour = ep.hour || formatHour(ep.createdAt)
        const d = new Date(ep.createdAt)
        const moonInfo = showMoon ? getMoonPhaseName(d) : null
        const planets = showPlanets ? getPlanetPositions(d).filter((p) => p.id !== 'terre') : null
        return (
          <div key={ep.id} className={`anim-fadeInUp anim-d${Math.min(i + 1, 8)}`} style={{
            background: colors.sand.bg, borderRadius: radius.md, padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.muted, minWidth: 42 }}>{hour}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: INTENSITY_COLOR(ep.intensity || 0), flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.text.body, flex: 1 }}>{condLabel}</span>
              <span style={{ fontSize: 12, color: colors.text.soft }}>{ep.intensity || 0}/10</span>
              {ep.duration && <span style={{ fontSize: 11, color: colors.text.faint }}>{ep.duration}</span>}
            </div>
            {(moonInfo || planets) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginLeft: 52, flexWrap: 'wrap' }}>
                {moonInfo && (
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 5,
                    background: '#F0ECE0', color: '#7A7060',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <i className="ti ti-moon" style={{ fontSize: 10 }} aria-hidden="true" />
                    {moonInfo.label}
                  </span>
                )}
                {planets && planets.map((p) => (
                  <span key={p.id} style={{
                    fontSize: 9, padding: '2px 5px', borderRadius: 4,
                    background: colors.green.soft, color: colors.text.soft,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: PLANET_DOT_COLORS[p.id] || colors.text.faint }} />
                    {zodiacAbbr(p.angle)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="anim-fadeInUp" style={{ flex: 1, background: colors.sand.bg, borderRadius: radius.md, padding: 12 }}>
      <div style={{ fontSize: 11, color: colors.sand.text }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 600, color: colors.text.body }}>
        <AnimatedNumber value={value} />{suffix && value !== '\u2014' && <span style={{ fontSize: 12, color: colors.sand.faint }}>{suffix}</span>}
      </div>
    </div>
  )
}

function NavBtn({ icon, onClick, label, disabled }) {
  return (
    <button onClick={onClick} aria-label={label} disabled={disabled}
      style={{
        border: 'none', background: colors.green.soft, borderRadius: 8,
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1,
        color: colors.green.primaryDark, fontSize: 16,
      }}>
      <i className={`ti ${icon}`} aria-hidden="true" />
    </button>
  )
}

export default function Dashboard({ onLog, bp = 'mobile' }) {
  const { episodes, profile } = useStore()
  const [view, setView] = useState('s')
  const [offset, setOffset] = useState(0)
  const wide = bp === 'desktop'

  const real = withoutBienetre(episodes)
  const streak = currentStreak(episodes)
  const filtered = filterByPeriod(real, view, offset)
  const stats = computeStats(filtered)
  const series = view !== 'j' ? buildSeries(real, view, offset) : null
  const dayEpisodes = view === 'j' ? buildDaySeries(real, offset) : []
  const pLabel = periodLabel(view, offset)

  function handleViewChange(v) {
    setView(v)
    setOffset(0)
  }

  if (real.length === 0) {
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
        options={[{ value: 'j', label: 'Jour' }, { value: 's', label: 'Semaine' }, { value: 'm', label: 'Mois' }, { value: 'a', label: 'Annee' }]}
        value={view} onChange={handleViewChange} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
        <NavBtn icon="ti-chevron-left" onClick={() => setOffset((o) => o - 1)} label="Periode precedente" />
        <button onClick={() => setOffset(0)}
          style={{
            border: 'none', background: offset === 0 ? colors.green.soft : colors.green.softer,
            borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600,
            color: colors.green.primaryDark, cursor: 'pointer', fontFamily: 'inherit',
            minWidth: 140, textAlign: 'center',
          }}>
          {pLabel}
        </button>
        <NavBtn icon="ti-chevron-right" onClick={() => setOffset((o) => Math.min(o + 1, 0))} label="Periode suivante" disabled={offset >= 0} />
      </div>

      {view === 'j' ? (
        <EpisodeList episodes={dayEpisodes} showMoon={profile.moonOn} showPlanets={profile.planetsOn} />
      ) : (
        <>
          <BarChart bars={series.bars} labels={series.labels} height={wide ? 150 : 96} />
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: colors.text.soft, margin: '6px 0 0' }}>
            <LegendDot color={colors.green.leaf}>jour calme</LegendDot>
            <LegendDot color={colors.amber.bar}>episode leger</LegendDot>
            <LegendDot color={colors.coral.barStrong}>episode fort</LegendDot>
          </div>
        </>
      )}
    </>
  )

  const statsBlock = (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StatCard label="Episodes" value={String(stats.count)} />
        <StatCard label="Intensite moy." value={stats.avgIntensity} suffix="/10" />
      </div>
      {stats.topTriggers.length > 0 && (
        <div className="anim-fadeInUp anim-d3" style={{ background: colors.green.soft, borderRadius: radius.md, padding: '12px 14px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
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
      <ScreenHeader title="Mon historique" right={<StreakBadge><AnimatedNumber value={streak} /> j</StreakBadge>} />
      {wide ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
          <div>{chartBlock}</div>
          <div>
            {statsBlock}
            {(profile.moonOn || profile.planetsOn) && (
              <div style={{ marginTop: 14 }}><PlanetaryWidget compact showMoon={profile.moonOn} showPlanets={profile.planetsOn} /></div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>{chartBlock}</div>
          {statsBlock}
          {(profile.moonOn || profile.planetsOn) && (
            <div style={{ marginTop: 14 }}><PlanetaryWidget compact showMoon={profile.moonOn} showPlanets={profile.planetsOn} /></div>
          )}
        </>
      )}
      <div style={{ flex: 1 }} />
    </Screen>
  )
}
