import { useState, useEffect } from 'react'
import { colors, radius } from '../theme/tokens'
import { getPlanetPositions, getMoonPhase, getMoonPhaseName } from '../data/astro'

// Couleurs des planetes — palette jardin enrichie
const PLANET_STYLE = {
  mercure:  { color: '#B8AFA0', r: 2.5, label: 'Mercure', spin: '8s' },
  venus:    { color: colors.amber.border, r: 3.2, label: 'Venus', spin: '12s' },
  terre:    { color: colors.green.primary, r: 4, label: 'Terre', spin: '10s' },
  mars:     { color: colors.coral.barStrong, r: 3, label: 'Mars', spin: '11s' },
  jupiter:  { color: colors.amber.text, r: 5.5, label: 'Jupiter', spin: '6s' },
  saturne:  { color: '#C4B17C', r: 4.5, label: 'Saturne', spin: '7s' },
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

// Vitesses orbitales (animation dash) — plus proche = plus rapide
const ORBIT_SPEED = {
  mercure: '4s',
  venus: '6s',
  terre: '8s',
  mars: '12s',
  jupiter: '20s',
  saturne: '30s',
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

// Palette lune adaptee a la DA jardin
const MOON = {
  dark: '#5A6B5E',
  light: '#FFFDE7',
  rim: '#C4B17C',
  glowColor: colors.amber.border,
}

/** Icone SVG de phase lunaire */
function MoonIcon({ phase, cx, cy, r, glow = false }) {
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const waxing = phase <= 0.5

  if (illumination < 0.04) {
    return (
      <g>
        {glow && <circle cx={cx} cy={cy} r={r + 3} fill={MOON.glowColor} opacity="0.12">
          <animate attributeName="opacity" values="0.12;0.22;0.12" dur="3s" repeatCount="indefinite" />
        </circle>}
        <circle cx={cx} cy={cy} r={r} fill={MOON.dark} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={MOON.rim} strokeWidth="0.6" opacity="0.4" />
      </g>
    )
  }
  if (illumination > 0.96) {
    return (
      <g>
        {glow && <circle cx={cx} cy={cy} r={r + 4} fill={MOON.glowColor} opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.28;0.15" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values={`${r + 3};${r + 5};${r + 3}`} dur="3s" repeatCount="indefinite" />
        </circle>}
        <circle cx={cx} cy={cy} r={r} fill={MOON.light} />
        <circle cx={cx} cy={cy} r={r + 1.5} fill="none" stroke={MOON.glowColor} strokeWidth="0.5" opacity="0.25" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={MOON.rim} strokeWidth="0.4" />
      </g>
    )
  }

  const sweep = waxing ? 1 : 0
  const k = (1 - illumination * 2) * r

  return (
    <g>
      {glow && <circle cx={cx} cy={cy} r={r + 3} fill={MOON.glowColor} opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
      </circle>}
      <circle cx={cx} cy={cy} r={r} fill={waxing ? MOON.dark : MOON.light} />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${Math.abs(k)} ${r} 0 0 ${k < 0 ? sweep : 1 - sweep} ${cx} ${cy - r}`}
        fill={waxing ? MOON.light : MOON.dark}
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={MOON.rim} strokeWidth="0.4" opacity="0.5" />
    </g>
  )
}

/** Mini lune pour le bandeau */
function MiniMoon({ phase, cx, cy, r }) {
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2
  const waxing = phase <= 0.5

  if (illumination < 0.04) {
    return <circle cx={cx} cy={cy} r={r} fill={MOON.dark} stroke={MOON.rim} strokeWidth="0.3" opacity="0.8" />
  }
  if (illumination > 0.96) {
    return <circle cx={cx} cy={cy} r={r} fill={MOON.light} stroke={MOON.rim} strokeWidth="0.4" />
  }
  const sweep = waxing ? 1 : 0
  const k = (1 - illumination * 2) * r
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={waxing ? MOON.dark : MOON.light} />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${Math.abs(k)} ${r} 0 0 ${k < 0 ? sweep : 1 - sweep} ${cx} ${cy - r}`}
        fill={waxing ? MOON.light : MOON.dark}
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={MOON.rim} strokeWidth="0.3" />
    </g>
  )
}

/** Planete animee avec rotation sur son axe et details de surface */
function AnimatedPlanet({ id, x, y }) {
  const style = PLANET_STYLE[id]
  const r = style.r

  // Jupiter : bandes horizontales qui tournent
  if (id === 'jupiter') {
    return (
      <g>
        <circle cx={x} cy={y} r={r} fill={style.color} />
        <clipPath id="clip-jupiter"><circle cx={x} cy={y} r={r - 0.3} /></clipPath>
        <g clipPath="url(#clip-jupiter)">
          <line x1={x - r} y1={y - 2} x2={x + r} y2={y - 2} stroke="#C4863A" strokeWidth="1" opacity="0.4">
            <animate attributeName="y1" values={`${y - 2};${y - 1};${y - 2}`} dur={style.spin} repeatCount="indefinite" />
            <animate attributeName="y2" values={`${y - 2};${y - 1};${y - 2}`} dur={style.spin} repeatCount="indefinite" />
          </line>
          <line x1={x - r} y1={y + 1.5} x2={x + r} y2={y + 1.5} stroke="#D4A05A" strokeWidth="0.7" opacity="0.35">
            <animate attributeName="y1" values={`${y + 1.5};${y + 2.5};${y + 1.5}`} dur={style.spin} repeatCount="indefinite" />
            <animate attributeName="y2" values={`${y + 1.5};${y + 2.5};${y + 1.5}`} dur={style.spin} repeatCount="indefinite" />
          </line>
        </g>
      </g>
    )
  }

  // Saturne : rotation de l'anneau
  if (id === 'saturne') {
    return (
      <g>
        <circle cx={x} cy={y} r={r} fill={style.color} />
        <ellipse cx={x} cy={y} rx={r + 3} ry={r * 0.35}
          fill="none" stroke={style.color} strokeWidth="0.8" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate"
            values={`-20 ${x} ${y}; -18 ${x} ${y}; -20 ${x} ${y}`}
            dur="8s" repeatCount="indefinite" />
        </ellipse>
        {/* Petit reflet anime */}
        <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.25} fill="#fff" opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.25;0.15" dur="4s" repeatCount="indefinite" />
        </circle>
      </g>
    )
  }

  // Terre : continents qui tournent + halo
  if (id === 'terre') {
    return (
      <g>
        <circle cx={x} cy={y} r={r + 6} fill="url(#earthGlow)" />
        <circle cx={x} cy={y} r={r} fill={colors.green.primary} />
        <clipPath id="clip-terre"><circle cx={x} cy={y} r={r - 0.3} /></clipPath>
        <g clipPath="url(#clip-terre)">
          {/* Tache continent qui tourne */}
          <ellipse cx={x - 1} cy={y - 0.5} rx={1.8} ry={1.2} fill={colors.green.primaryDark} opacity="0.4">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${x} ${y}`} to={`360 ${x} ${y}`}
              dur={style.spin} repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={x + 1.5} cy={y + 1} rx={1.2} ry={0.8} fill={colors.green.primaryDark} opacity="0.3">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${x} ${y}`} to={`360 ${x} ${y}`}
              dur={style.spin} repeatCount="indefinite" />
          </ellipse>
        </g>
        <circle cx={x} cy={y} r={r} fill="none" stroke={colors.green.leaf} strokeWidth="1.2" opacity="0.5" />
      </g>
    )
  }

  // Mars : tache polaire qui tourne
  if (id === 'mars') {
    return (
      <g>
        <circle cx={x} cy={y} r={r} fill={style.color} />
        <clipPath id="clip-mars"><circle cx={x} cy={y} r={r - 0.2} /></clipPath>
        <g clipPath="url(#clip-mars)">
          <circle cx={x + 0.5} cy={y - r * 0.5} r={0.8} fill="#E8A080" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${x} ${y}`} to={`360 ${x} ${y}`}
              dur={style.spin} repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    )
  }

  // Venus : reflet brillant qui tourne
  if (id === 'venus') {
    return (
      <g>
        <circle cx={x} cy={y} r={r} fill={style.color} />
        <circle cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.3} fill="#fff" opacity="0.2">
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${x} ${y}`} to={`360 ${x} ${y}`}
            dur={style.spin} repeatCount="indefinite" />
        </circle>
      </g>
    )
  }

  // Mercure : subtil reflet
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={style.color} />
      <circle cx={x - r * 0.2} cy={y - r * 0.3} r={r * 0.2} fill="#fff" opacity="0.15">
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${x} ${y}`} to={`360 ${x} ${y}`}
          dur={style.spin} repeatCount="indefinite" />
      </circle>
    </g>
  )
}

/** Bandeau visuel des 8 phases — palette jardin */
function MoonPhaseStrip({ moonPhase, moonInfo }) {
  const waxing = moonPhase <= 0.5
  const direction = waxing ? 'Croissante' : 'Decroissante'
  const dirIcon = waxing ? 'ti-trending-up' : 'ti-trending-down'
  const cursorPct = moonPhase * 100

  return (
    <div style={{
      background: colors.sand.bg, borderRadius: radius.md,
      padding: '14px 16px 12px', marginTop: 10,
      border: `1px solid ${colors.border.soft}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" role="img" aria-label={moonInfo.label}>
            <MoonIcon phase={moonPhase} cx={15} cy={15} r={13} glow />
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.title }}>{moonInfo.label}</div>
            {moonInfo.description && (
              <div style={{ fontSize: 11, color: colors.sand.text, fontStyle: 'italic' }}>{moonInfo.description}</div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: colors.amber.text, background: colors.amber.bg,
          padding: '4px 9px', borderRadius: 8, fontWeight: 500,
        }}>
          <i className={`ti ${dirIcon}`} style={{ fontSize: 13 }} aria-hidden="true" />
          {direction}
        </div>
      </div>

      <div style={{ position: 'relative', padding: '0 4px' }}>
        <svg viewBox="0 0 280 34" style={{ width: '100%', display: 'block' }}>
          <line x1="10" y1="17" x2="270" y2="17" stroke={colors.border.soft} strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="17" x2={10 + (cursorPct / 100) * 260} y2="17"
            stroke={colors.green.leafLight} strokeWidth="2" strokeLinecap="round" />

          {PHASE_ICONS.map((p, i) => {
            const px = 10 + (i / 7) * 260
            const dist = Math.abs(moonPhase - p.phase)
            const isCurrent = dist < 0.07 || (p.phase === 0 && moonPhase > 0.93)
            const moonR = isCurrent ? 7.5 : 5
            const opacity = isCurrent ? 1 : 0.5
            return (
              <g key={i} opacity={opacity}>
                <circle cx={px} cy={17} r={moonR + 1.5} fill={colors.sand.bg} />
                <MiniMoon phase={p.phase} cx={px} cy={17} r={moonR} />
              </g>
            )
          })}

          <circle cx={10 + (cursorPct / 100) * 260} cy={17} r="11" fill="none"
            stroke={colors.green.leaf} strokeWidth="1.5" opacity="0.5">
            <animate attributeName="opacity" values="0.4;0.75;0.4" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="11;12.5;11" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {waxing ? (
            <polygon
              points={`${10 + (cursorPct / 100) * 260 + 15},17 ${10 + (cursorPct / 100) * 260 + 11},14 ${10 + (cursorPct / 100) * 260 + 11},20`}
              fill={colors.green.leaf} opacity="0.5">
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
            </polygon>
          ) : (
            <polygon
              points={`${10 + (cursorPct / 100) * 260 - 15},17 ${10 + (cursorPct / 100) * 260 - 11},14 ${10 + (cursorPct / 100) * 260 - 11},20`}
              fill={colors.green.leaf} opacity="0.5">
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
            </polygon>
          )}
        </svg>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: colors.sand.text, marginTop: 4, padding: '0 2px',
        }}>
          <span>Nouvelle</span>
          <span>1er Q.</span>
          <span>Pleine</span>
          <span>Dern. Q.</span>
          <span>Nouvelle</span>
        </div>
      </div>
    </div>
  )
}

/** Mode complet : vue de dessus du systeme solaire */
function FullWidget({ planets, moonPhase, moonInfo, showMoon = true, showPlanets = true }) {
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

  // Moon-only: skip the orbital chart, just show the strip
  if (showMoon && !showPlanets) {
    return <MoonPhaseStrip moonPhase={moonPhase} moonInfo={moonInfo} />
  }

  return (
    <div>
      <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }}
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

        {/* Orbites avec animation de dash tournant */}
        {Object.entries(ORBIT_R).map(([id, r]) => {
          const circumference = 2 * Math.PI * r
          const dashLen = circumference / 12
          const isTerre = id === 'terre'
          return (
            <circle key={id} cx={CX} cy={CY} r={r} fill="none"
              stroke={isTerre ? colors.green.leafLight : colors.border.soft}
              strokeWidth={isTerre ? '0.8' : '0.4'}
              strokeDasharray={`${dashLen} ${dashLen * 0.8}`}
              opacity="0.7">
              <animateTransform attributeName="transform" type="rotate"
                from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`}
                dur={ORBIT_SPEED[id]} repeatCount="indefinite" />
            </circle>
          )
        })}

        {/* Soleil avec pulse + rayons */}
        <circle cx={CX} cy={CY} r="14" fill={colors.amber.bg} opacity="0.12">
          <animate attributeName="r" values="14;16;14" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.2;0.12" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx={CX} cy={CY} r="8" fill="url(#sunGlow)" />
        <circle cx={CX} cy={CY} r="5" fill={colors.amber.bg} />
        {/* Petits rayons animés */}
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const rad = toRad(a)
          return (
            <line key={a}
              x1={CX + 9 * Math.cos(rad)} y1={CY + 9 * Math.sin(rad)}
              x2={CX + 12 * Math.cos(rad)} y2={CY + 12 * Math.sin(rad)}
              stroke={colors.amber.border} strokeWidth="0.6" strokeLinecap="round" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" begin={`${a / 360}s`} repeatCount="indefinite" />
            </line>
          )
        })}

        {/* Planetes animees (sauf Terre, dessinee via AnimatedPlanet) */}
        {planets.filter((p) => p.id !== 'terre').map((p) => {
          const orbit = ORBIT_R[p.id]
          const { x, y } = planetXY(p.angle, orbit)
          return <AnimatedPlanet key={p.id} id={p.id} x={x} y={y} />
        })}

        {/* Terre animee */}
        {terrePos && (
          <g>
            <AnimatedPlanet id="terre" x={terrePos.x} y={terrePos.y} />
            <text x={terrePos.x} y={terrePos.y - PLANET_STYLE.terre.r - 5}
              textAnchor="middle" fontSize="7" fill={colors.green.primaryDark}
              fontFamily="Nunito, sans-serif" fontWeight="600">Terre</text>
          </g>
        )}

        {/* Lune avec halo */}
        {showMoon && terrePos && moonPos && (
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

      {showMoon && <MoonPhaseStrip moonPhase={moonPhase} moonInfo={moonInfo} />}
    </div>
  )
}

/** Mode compact : bandeau horizontal avec lune et planetes */
function CompactWidget({ planets, moonPhase, moonInfo, showMoon = true, showPlanets = true }) {
  const waxing = moonPhase <= 0.5
  const cursorPct = moonPhase * 100

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {showMoon && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" role="img" aria-label={moonInfo.label}>
              <MoonIcon phase={moonPhase} cx={13} cy={13} r={11} glow />
            </svg>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12.5, color: colors.text.body, fontWeight: 500 }}>{moonInfo.label}</span>
                <i className={`ti ${waxing ? 'ti-trending-up' : 'ti-trending-down'}`}
                  style={{ fontSize: 12, color: colors.amber.text }} aria-hidden="true" />
              </div>
              {moonInfo.description && (
                <div style={{ fontSize: 11, color: colors.text.soft, fontStyle: 'italic' }}>{moonInfo.description}</div>
              )}
            </div>
          </div>
        )}
        {showMoon && showPlanets && (
          <div style={{ width: 1, height: 16, background: colors.border.soft }} />
        )}
        {showPlanets && (
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
        )}
      </div>

      {showMoon && (
        <div style={{ marginTop: 8, position: 'relative' }}>
          <svg viewBox="0 0 200 16" style={{ width: '100%', display: 'block' }}>
            <line x1="4" y1="8" x2="196" y2="8" stroke={colors.border.soft} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="8" x2={4 + (cursorPct / 100) * 192} y2="8"
              stroke={colors.green.leafLight} strokeWidth="1.5" strokeLinecap="round" />
            {PHASE_ICONS.map((p, i) => {
              const px = 4 + (i / 7) * 192
              const dist = Math.abs(moonPhase - p.phase)
              const isCurrent = dist < 0.07 || (p.phase === 0 && moonPhase > 0.93)
              return (
                <g key={i} opacity={isCurrent ? 1 : 0.45}>
                  <circle cx={px} cy={8} r={isCurrent ? 6 : 4.5} fill={colors.sand.bg} />
                  <MiniMoon phase={p.phase} cx={px} cy={8} r={isCurrent ? 5.5 : 4} />
                </g>
              )
            })}
            <circle cx={4 + (cursorPct / 100) * 192} cy={8} r="8" fill="none"
              stroke={colors.green.leaf} strokeWidth="1" opacity="0.5">
              <animate attributeName="opacity" values="0.4;0.75;0.4" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      )}
    </div>
  )
}

export default function PlanetaryWidget({ compact = false, showMoon = true, showPlanets = true }) {
  const [data, setData] = useState(() => compute())

  useEffect(() => {
    const id = setInterval(() => setData(compute()), 60000)
    return () => clearInterval(id)
  }, [])

  if (!showMoon && !showPlanets) return null

  const Widget = compact ? CompactWidget : FullWidget

  return (
    <div style={{
      background: compact ? colors.sand.bg : colors.green.bg,
      borderRadius: radius.md,
      padding: compact ? '10px 14px' : '16px 16px 12px',
    }}>
      <Widget planets={data.planets} moonPhase={data.moonPhase} moonInfo={data.moonInfo}
        showMoon={showMoon} showPlanets={showPlanets} />
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
