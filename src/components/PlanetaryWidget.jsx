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

function toRad(deg) { return (deg * Math.PI) / 180 }

function planetXY(angle, orbitR) {
  const rad = toRad(angle - 90)
  return { x: CX + orbitR * Math.cos(rad), y: CY + orbitR * Math.sin(rad) }
}

/** Icone SVG de phase lunaire — rendu realiste */
function MoonIcon({ phase, cx, cy, r }) {
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const waxing = phase <= 0.5

  const darkFill = '#4A5568'
  const lightFill = '#FFFDE7'
  const rimColor = '#E8DFC0'

  if (illumination < 0.04) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={darkFill} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={rimColor} strokeWidth="0.6" opacity="0.5" />
      </g>
    )
  }
  if (illumination > 0.96) {
    return (
      <g>
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
      <circle cx={cx} cy={cy} r={r} fill={waxing ? darkFill : lightFill} />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${Math.abs(k)} ${r} 0 0 ${k < 0 ? sweep : 1 - sweep} ${cx} ${cy - r}`}
        fill={waxing ? lightFill : darkFill}
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={rimColor} strokeWidth="0.4" opacity="0.6" />
    </g>
  )
}

/** Mode complet : vue de dessus du systeme solaire */
function FullWidget({ planets, moonPhase, moonInfo }) {
  const terre = planets.find((p) => p.id === 'terre')
  const terrePos = terre ? planetXY(terre.angle, ORBIT_R.terre) : null

  // Position de la Lune autour de la Terre
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

        {/* Soleil */}
        <circle cx={CX} cy={CY} r="12" fill={colors.amber.bg} opacity="0.2" />
        <circle cx={CX} cy={CY} r="8" fill="url(#sunGlow)" />
        <circle cx={CX} cy={CY} r="5" fill={colors.amber.bg} />

        {/* Planetes (sauf Terre, dessinee en dernier) */}
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

        {/* Terre — plus grande, avec halo */}
        {terrePos && (
          <g>
            <circle cx={terrePos.x} cy={terrePos.y} r="10" fill="url(#earthGlow)" />
            <circle cx={terrePos.x} cy={terrePos.y} r={PLANET_STYLE.terre.r} fill={colors.green.primary} />
            <circle cx={terrePos.x} cy={terrePos.y} r={PLANET_STYLE.terre.r} fill="none"
              stroke={colors.green.leaf} strokeWidth="1.2" opacity="0.5" />
            {/* Label Terre */}
            <text x={terrePos.x} y={terrePos.y - PLANET_STYLE.terre.r - 4}
              textAnchor="middle" fontSize="7" fill={colors.green.primaryDark}
              fontFamily="Nunito, sans-serif" fontWeight="600">Terre</text>
          </g>
        )}

        {/* Lune — orbite visible + icone de phase */}
        {terrePos && moonPos && (
          <g>
            <circle cx={terrePos.x} cy={terrePos.y} r="10" fill="none"
              stroke={colors.text.faint} strokeWidth="0.3" strokeDasharray="1 2" opacity="0.5" />
            <MoonIcon phase={moonPhase} cx={moonPos.x} cy={moonPos.y} r={3} />
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

      {/* Phase lunaire avec visuel */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 8, padding: '7px 0',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label={moonInfo.label}>
          <MoonIcon phase={moonPhase} cx={12} cy={12} r={10} />
        </svg>
        <span style={{ fontSize: 12.5, color: colors.text.body, fontWeight: 500 }}>{moonInfo.label}</span>
      </div>
    </div>
  )
}

/** Mode compact : bandeau horizontal avec lune et planetes */
function CompactWidget({ planets, moonPhase, moonInfo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" role="img" aria-label={moonInfo.label}>
          <MoonIcon phase={moonPhase} cx={11} cy={11} r={9.5} />
        </svg>
        <span style={{ fontSize: 12.5, color: colors.text.body, fontWeight: 500 }}>{moonInfo.label}</span>
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
