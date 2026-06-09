import { useState, useEffect } from 'react'
import { colors, radius } from '../theme/tokens'
import { getPlanetPositions, getMoonPhase, getMoonPhaseName } from '../data/astro'

// Couleurs des planetes — palette jardin enrichie
const PLANET_STYLE = {
  mercure:  { color: '#B8AFA0', r: 2.5, label: 'Mercure' },
  venus:    { color: colors.amber.border, r: 3.2, label: 'Venus' },
  terre:    { color: colors.green.primary, r: 4, label: 'Terre' },
  mars:     { color: colors.coral.barStrong, r: 3, label: 'Mars' },
  jupiter:  { color: colors.amber.text, r: 5.5, label: 'Jupiter' },
  saturne:  { color: '#C4B17C', r: 4.5, label: 'Saturne' },
}

// Rayons d'orbite comprimes pour le SVG 240x240
const CX = 120, CY = 120
const ORBIT_R = {
  mercure: 30,
  venus: 44,
  terre: 58,
  mars: 72,
  jupiter: 90,
  saturne: 108,
}

// 8 phases pour le bandeau visuel
const PHASE_ICONS = [
  { phase: 0.0,    label: 'Nouvelle' },
  { phase: 0.125,  label: 'Premier croissant' },
  { phase: 0.25,   label: 'Premier quartier' },
  { phase: 0.375,  label: 'Gibbeuse croissante' },
  { phase: 0.5,    label: 'Pleine' },
  { phase: 0.625,  label: 'Gibbeuse decroissante' },
  { phase: 0.75,   label: 'Dernier quartier' },
  { phase: 0.875,  label: 'Dernier croissant' },
]

function toRad(deg) { return (deg * Math.PI) / 180 }

function planetXY(angle, orbitR) {
  const rad = toRad(angle - 90)
  return { x: CX + orbitR * Math.cos(rad), y: CY + orbitR * Math.sin(rad) }
}

/** Icone SVG de phase lunaire — rendu realiste */
function MoonIcon({ phase, cx, cy, r, glow = false }) {
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const waxing = phase <= 0.5

  const darkFill = '#4A5568'
  const lightFill = '#FFFDE7'
  const rimColor = '#E8DFC0'

  if (illumination < 0.04) {
    return (
      <g>
        {glow && <circle cx={cx} cy={cy} r={r + 3} fill={rimColor} opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
        </circle>}
        <circle cx={cx} cy={cy} r={r} fill={darkFill} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={rimColor} strokeWidth="0.6" opacity="0.5" />
      </g>
    )
  }
  if (illumination > 0.96) {
    return (
      <g>
        {glow && <circle cx={cx} cy={cy} r={r + 4} fill={lightFill} opacity="0.2">
          <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values={`${r + 3};${r + 5};${r + 3}`} dur="3s" repeatCount="indefinite" />
        </circle>}
        <circle cx={cx} cy={cy} r={r} fill={lightFill} />
        <circle cx={cx} cy={cy} r={r + 1.5} fill="none" stroke={lightFill} strokeWidth="0.5" opacity="0.3" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={rimColor} strokeWidth="0.4" />
      </g>
    )
  }

  const sweep = waxing ? 1 : 0
  const k = (1 - illumination * 2) * r

  return (
    <g>
      {glow && <circle cx={cx} cy={cy} r={r + 3} fill={lightFill} opacity="0.12">
        <animate attributeName="opacity" values="0.12;0.22;0.12" dur="3s" repeatCount="indefinite" />
      </circle>}
      <circle cx={cx} cy={cy} r={r} fill={waxing ? darkFill : lightFill} />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${Math.abs(k)} ${r} 0 0 ${k < 0 ? sweep : 1 - sweep} ${cx} ${cy - r}`}
        fill={waxing ? lightFill : darkFill}
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={rimColor} strokeWidth="0.4" opacity="0.6" />
    </g>
  )
}

/** Mini lune pour le bandeau de phases */
function MiniMoon({ phase, cx, cy, r }) {
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const waxing = phase <= 0.5
  const darkFill = '#6B7280'
  const lightFill = '#FFFDE7'

  if (illumination < 0.04) {
    return <circle cx={cx} cy={cy} r={r} fill={darkFill} stroke="#9CA3AF" strokeWidth="0.3" />
  }
  if (illumination > 0.96) {
    return <circle cx={cx} cy={cy} r={r} fill={lightFill} stroke="#E8DFC0" strokeWidth="0.3" />
  }
  const sweep = waxing ? 1 : 0
  const k = (1 - illumination * 2) * r
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={waxing ? darkFill : lightFill} />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${Math.abs(k)} ${r} 0 0 ${k < 0 ? sweep : 1 - sweep} ${cx} ${cy - r}`}
        fill={waxing ? lightFill : darkFill}
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8DFC0" strokeWidth="0.3" />
    </g>
  )
}

/** Bandeau visuel des 8 phases avec curseur de position */
function MoonPhaseStrip({ moonPhase, moonInfo }) {
  const waxing = moonPhase <= 0.5
  const direction = waxing ? 'Croissante' : 'Decroissante'
  const dirIcon = waxing ? 'ti-arrow-right' : 'ti-arrow-left'

  // Position du curseur en pourcentage
  const cursorPct = moonPhase * 100

  return (
    <div style={{
      background: '#1A2332', borderRadius: radius.md,
      padding: '14px 16px 12px', marginTop: 10,
    }}>
      {/* Titre + direction */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-label={moonInfo.label}>
            <MoonIcon phase={moonPhase} cx={14} cy={14} r={12} glow />
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFDE7' }}>{moonInfo.label}</div>
            {moonInfo.description && (
              <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>{moonInfo.description}</div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: '#9CA3AF', background: 'rgba(255,255,255,0.06)',
          padding: '4px 8px', borderRadius: 8,
        }}>
          <i className={`ti ${dirIcon}`} style={{ fontSize: 12 }} aria-hidden="true" />
          {direction}
        </div>
      </div>

      {/* Bandeau des 8 phases */}
      <div style={{ position: 'relative', padding: '0 6px' }}>
        <svg viewBox="0 0 280 32" style={{ width: '100%', display: 'block' }}>
          {/* Ligne de fond */}
          <line x1="10" y1="16" x2="270" y2="16" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" />

          {/* 8 icones de phase */}
          {PHASE_ICONS.map((p, i) => {
            const px = 10 + (i / 7) * 260
            const dist = Math.abs(moonPhase - p.phase)
            const isCurrent = dist < 0.07 || (p.phase === 0 && moonPhase > 0.93)
            const moonR = isCurrent ? 7 : 5
            const opacity = isCurrent ? 1 : 0.45
            return (
              <g key={i} opacity={opacity}>
                <MiniMoon phase={p.phase} cx={px} cy={16} r={moonR} />
              </g>
            )
          })}

          {/* Curseur anime — position actuelle */}
          <circle cx={10 + (cursorPct / 100) * 260} cy={16} r="10" fill="none"
            stroke="#FFFDE7" strokeWidth="1.2" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="10;11.5;10" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Fleche de direction */}
          {waxing ? (
            <polygon
              points={`${10 + (cursorPct / 100) * 260 + 14},16 ${10 + (cursorPct / 100) * 260 + 10},13 ${10 + (cursorPct / 100) * 260 + 10},19`}
              fill="#FFFDE7" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
            </polygon>
          ) : (
            <polygon
              points={`${10 + (cursorPct / 100) * 260 - 14},16 ${10 + (cursorPct / 100) * 260 - 10},13 ${10 + (cursorPct / 100) * 260 - 10},19`}
              fill="#FFFDE7" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
            </polygon>
          )}
        </svg>

        {/* Labels dessous */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: '#6B7280', marginTop: 4, padding: '0 4px',
        }}>
          <span>Nouvelle</span>
          <span>Premier Q.</span>
          <span>Pleine</span>
          <span>Dernier Q.</span>
          <span>Nouvelle</span>
        </div>
      </div>
    </div>
  )
}

/** Mode complet : vue de dessus du systeme solaire */
function FullWidget({ planets, moonPhase, moonInfo }) {
  const terre = planets.find((p) => p.id === 'terre')
  const terrePos = terre ? planetXY(terre.angle, ORBIT_R.terre) : null

  let moonPos = null
  if (terrePos) {
    const moonOrbitR = 10
    const moonAngleDeg = moonPhase * 360
    const rad = toRad(moonAngleDeg - 90)
    moonPos = {
      x: terrePos.x + moonOrbitR * Math.cos(rad),
      y: terrePos.y + moonOrbitR * Math.sin(rad),
    }
  }

  return (
    <div>
      <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto' }}
        role="img" aria-label="Schema du systeme solaire">
        <defs>
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor={colors.amber.bg} />
            <stop offset="50%" stopColor={colors.amber.border} />
            <stop offset="100%" stopColor="#D4960A" />
          </radialGradient>
          <radialGradient id="earthGlow">
            <stop offset="0%" stopColor={colors.green.leaf} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.green.leaf} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Orbites */}
        {Object.entries(ORBIT_R).map(([id, r]) => (
          <circle key={id} cx={CX} cy={CY} r={r} fill="none"
            stroke={id === 'terre' ? colors.green.leafLight : colors.border.soft}
            strokeWidth={id === 'terre' ? '0.8' : '0.4'} strokeDasharray="3 4" opacity="0.7" />
        ))}

        {/* Soleil avec pulse */}
        <circle cx={CX} cy={CY} r="12" fill={colors.amber.bg} opacity="0.2">
          <animate attributeName="r" values="12;14;12" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.3;0.2" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx={CX} cy={CY} r="8" fill="url(#sunGlow)" />
        <circle cx={CX} cy={CY} r="5" fill={colors.amber.bg} />

        {/* Planetes (sauf Terre) */}
        {planets.filter((p) => p.id !== 'terre').map((p) => {
          const style = PLANET_STYLE[p.id]
          const orbit = ORBIT_R[p.id]
          const { x, y } = planetXY(p.angle, orbit)
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r={style.r} fill={style.color} />
              {p.id === 'saturne' && (
                <ellipse cx={x} cy={y} rx={style.r + 3} ry={style.r * 0.35}
                  fill="none" stroke={style.color} strokeWidth="0.8" opacity="0.6"
                  transform={`rotate(-20 ${x} ${y})`} />
              )}
            </g>
          )
        })}

        {/* Terre */}
        {terrePos && (
          <g>
            <circle cx={terrePos.x} cy={terrePos.y} r="10" fill="url(#earthGlow)" />
            <circle cx={terrePos.x} cy={terrePos.y} r={PLANET_STYLE.terre.r} fill={colors.green.primary} />
            <circle cx={terrePos.x} cy={terrePos.y} r={PLANET_STYLE.terre.r} fill="none"
              stroke={colors.green.leaf} strokeWidth="1.2" opacity="0.5" />
            <text x={terrePos.x} y={terrePos.y - PLANET_STYLE.terre.r - 4}
              textAnchor="middle" fontSize="7" fill={colors.green.primaryDark}
              fontFamily="Nunito, sans-serif" fontWeight="600">Terre</text>
          </g>
        )}

        {/* Lune avec halo anime */}
        {terrePos && moonPos && (
          <g>
            <circle cx={terrePos.x} cy={terrePos.y} r="10" fill="none"
              stroke={colors.text.faint} strokeWidth="0.3" strokeDasharray="1 2" opacity="0.5" />
            <MoonIcon phase={moonPhase} cx={moonPos.x} cy={moonPos.y} r={3} glow />
          </g>
        )}
      </svg>

      {/* Legende planetes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', justifyContent: 'center', marginTop: 8 }}>
        {planets.map((p) => (
          <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: colors.text.soft }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: PLANET_STYLE[p.id].color,
              border: p.id === 'terre' ? `1px solid ${colors.green.leaf}` : 'none',
            }} />
            {p.label}
          </span>
        ))}
      </div>

      {/* Bandeau de phases lunaires */}
      <MoonPhaseStrip moonPhase={moonPhase} moonInfo={moonInfo} />
    </div>
  )
}

/** Mode compact : bandeau horizontal avec lune et planetes */
function CompactWidget({ planets, moonPhase, moonInfo }) {
  const waxing = moonPhase <= 0.5

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" role="img" aria-label={moonInfo.label}>
            <MoonIcon phase={moonPhase} cx={13} cy={13} r={11} glow />
          </svg>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12.5, color: colors.text.body, fontWeight: 500 }}>{moonInfo.label}</span>
              <i className={`ti ${waxing ? 'ti-arrow-right' : 'ti-arrow-left'}`}
                style={{ fontSize: 11, color: colors.text.faint }} aria-hidden="true" />
            </div>
            {moonInfo.description && (
              <div style={{ fontSize: 11, color: colors.text.soft, fontStyle: 'italic' }}>{moonInfo.description}</div>
            )}
          </div>
        </div>
        <div style={{ width: 1, height: 16, background: colors.border.soft }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {planets.map((p) => (
            <span key={p.id} title={p.label}
              style={{
                width: p.id === 'terre' ? 9 : 7, height: p.id === 'terre' ? 9 : 7,
                borderRadius: '50%', display: 'inline-block',
                background: PLANET_STYLE[p.id].color,
                border: p.id === 'terre' ? `1.5px solid ${colors.green.leaf}` : 'none',
              }} />
          ))}
        </div>
      </div>

      {/* Mini strip compact */}
      <div style={{ marginTop: 8, position: 'relative' }}>
        <svg viewBox="0 0 200 14" style={{ width: '100%', display: 'block' }}>
          <line x1="4" y1="7" x2="196" y2="7" stroke={colors.border.soft} strokeWidth="1.5" strokeLinecap="round" />
          {PHASE_ICONS.map((p, i) => {
            const px = 4 + (i / 7) * 192
            const dist = Math.abs(moonPhase - p.phase)
            const isCurrent = dist < 0.07 || (p.phase === 0 && moonPhase > 0.93)
            return (
              <g key={i} opacity={isCurrent ? 1 : 0.4}>
                <MiniMoon phase={p.phase} cx={px} cy={7} r={isCurrent ? 5.5 : 4} />
              </g>
            )
          })}
          <circle cx={4 + (moonPhase * 100 / 100) * 192} cy={7} r="7.5" fill="none"
            stroke={colors.green.leaf} strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  )
}

/**
 * Widget planetaire — affiche les positions du systeme solaire et la phase lunaire.
 * @param {boolean} compact — mode compact (bandeau) au lieu du schema complet
 */
export default function PlanetaryWidget({ compact = false }) {
  const [data, setData] = useState(() => compute())

  useEffect(() => {
    const id = setInterval(() => setData(compute()), 60000)
    return () => clearInterval(id)
  }, [])

  const Widget = compact ? CompactWidget : FullWidget

  return (
    <div style={{
      background: compact ? colors.sand.bg : colors.green.bg,
      borderRadius: radius.md,
      padding: compact ? '10px 14px' : '16px 16px 12px',
    }}>
      <Widget planets={data.planets} moonPhase={data.moonPhase} moonInfo={data.moonInfo} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, marginTop: compact ? 6 : 8,
        fontSize: 10, color: colors.text.faint,
      }}>
        <i className="ti ti-info-circle" style={{ fontSize: 12 }} aria-hidden="true" />
        Repere personnel — sans valeur medicale
      </div>
    </div>
  )
}

function compute() {
  const now = new Date()
  return {
    planets: getPlanetPositions(now),
    moonPhase: getMoonPhase(now),
    moonInfo: getMoonPhaseName(now),
  }
}
