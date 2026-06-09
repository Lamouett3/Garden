import { useState, useEffect } from 'react'
import { colors, radius } from '../theme/tokens'
import { getPlanetPositions, getMoonPhase, getMoonPhaseName } from '../data/astro'

// Couleurs des planetes — palette jardin
const PLANET_STYLE = {
  mercure:  { color: colors.sand.faint, r: 2.5 },
  venus:    { color: colors.amber.border, r: 3 },
  terre:    { color: colors.green.primary, r: 3.5 },
  mars:     { color: colors.coral.barStrong, r: 3 },
  jupiter:  { color: colors.amber.text, r: 4.5 },
  saturne:  { color: colors.sand.text, r: 4 },
}

// Rayons d'orbite comprimes pour le SVG (vue de dessus)
const ORBIT_R = {
  mercure: 28,
  venus: 40,
  terre: 52,
  mars: 64,
  jupiter: 78,
  saturne: 92,
}

function toRad(deg) { return (deg * Math.PI) / 180 }

function planetXY(angle, orbitR) {
  const rad = toRad(angle - 90) // 0deg = haut
  return { x: 100 + orbitR * Math.cos(rad), y: 100 + orbitR * Math.sin(rad) }
}

/** Icone SVG de phase lunaire */
function MoonIcon({ phase, cx, cy, r }) {
  // Phase 0 = nouvelle (sombre), 0.5 = pleine (claire)
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const waxing = phase <= 0.5

  // Fond sombre (partie non eclairee)
  const darkFill = colors.text.soft
  // Partie eclairee
  const lightFill = colors.amber.bg

  if (illumination < 0.05) {
    // Nouvelle lune — cercle sombre avec contour
    return <circle cx={cx} cy={cy} r={r} fill={darkFill} stroke={colors.text.faint} strokeWidth="0.5" />
  }
  if (illumination > 0.95) {
    // Pleine lune
    return <circle cx={cx} cy={cy} r={r} fill={lightFill} stroke={colors.amber.border} strokeWidth="0.5" />
  }

  // Croissant / gibbeuse : on dessine un path avec deux arcs
  const sweep = waxing ? 1 : 0
  // Decalage du point de controle pour le terminateur
  const k = (1 - illumination * 2) * r // negatif = gibbeuse

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={waxing ? darkFill : lightFill} />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${Math.abs(k)} ${r} 0 0 ${k < 0 ? sweep : 1 - sweep} ${cx} ${cy - r}`}
        fill={waxing ? lightFill : darkFill}
      />
    </g>
  )
}

/** Mode complet : vue de dessus du systeme solaire */
function FullWidget({ planets, moonPhase, moonInfo }) {
  return (
    <div>
      <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}
        role="img" aria-label="Schema du systeme solaire">
        {/* Orbites */}
        {Object.entries(ORBIT_R).map(([id, r]) => (
          <circle key={id} cx="100" cy="100" r={r} fill="none"
            stroke={colors.border.soft} strokeWidth="0.5" strokeDasharray="2 3" />
        ))}
        {/* Soleil */}
        <circle cx="100" cy="100" r="7" fill={colors.amber.border} />
        <circle cx="100" cy="100" r="4.5" fill={colors.amber.bg} />
        {/* Planetes */}
        {planets.map((p) => {
          const style = PLANET_STYLE[p.id]
          const orbit = ORBIT_R[p.id]
          const { x, y } = planetXY(p.angle, orbit)
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r={style.r} fill={style.color} />
              {p.id === 'terre' && (
                <circle cx={x} cy={y} r={style.r + 2.5} fill="none"
                  stroke={colors.green.leaf} strokeWidth="1" opacity="0.5" />
              )}
            </g>
          )
        })}
        {/* Lune pres de la Terre */}
        {(() => {
          const terre = planets.find((p) => p.id === 'terre')
          if (!terre) return null
          const { x, y } = planetXY(terre.angle, ORBIT_R.terre)
          // Lune a ~8px de la Terre, decalee selon la phase
          const moonAngle = toRad(terre.angle - 90 + 40)
          const mx = x + 8 * Math.cos(moonAngle)
          const my = y + 8 * Math.sin(moonAngle)
          return <MoonIcon phase={moonPhase} cx={mx} cy={my} r={2.5} />
        })()}
      </svg>
      {/* Legende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center', marginTop: 8 }}>
        {planets.filter((p) => p.id !== 'terre').map((p) => (
          <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: colors.text.faint }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PLANET_STYLE[p.id].color, display: 'inline-block' }} />
            {p.label}
          </span>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: colors.text.soft }}>
        <i className="ti ti-moon" style={{ fontSize: 13 }} aria-hidden="true" /> {moonInfo.label}
      </div>
    </div>
  )
}

/** Mode compact : bandeau horizontal */
function CompactWidget({ planets, moonPhase, moonInfo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" role="img" aria-label={moonInfo.label}>
          <MoonIcon phase={moonPhase} cx={9} cy={9} r={8} />
        </svg>
        <span style={{ fontSize: 12, color: colors.text.soft }}>{moonInfo.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {planets.filter((p) => p.id !== 'terre').map((p) => (
          <span key={p.id} title={p.label}
            style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_STYLE[p.id].color, display: 'inline-block' }} />
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
      background: colors.sand.bg, borderRadius: radius.md, padding: compact ? '10px 14px' : '14px 14px 12px',
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
