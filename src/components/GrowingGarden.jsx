// =============================================================
// GrowingGarden — le jardin qui pousse
//
// Animations : croissance organique, balancement au vent,
// respiration lumineuse, particules de pollen, papillon,
// herbe animée, progression bourgeon → bouton → fleur.
// Floraison progressive dès le jour 3.
// Décor météo dynamique via géolocalisation + Open-Meteo.
// Ciel dynamique (heure du jour), sol enrichi, faune progressive,
// récompenses jour 7.
// Props : days (nombre de jours distincts signalés)
// =============================================================

import { useState, useEffect } from 'react'
import { fetchWeather } from '../data/weather'

// Palette alignee sur les tokens DA (src/theme/tokens.js)
// Toutes les teintes derivent des verts, ambre, rose, corail, sable du design system.
const C = {
  // Tiges — verts d'identite DA
  stem: '#7FB089',       // colors.green.leaf
  stemDark: '#5A8262',   // colors.green.primary
  // Feuilles
  leafDark: '#5A8262',   // colors.green.primary
  leafLight: '#7FB089',  // colors.green.leaf
  // Sol — surfaces DA
  ground: '#E7EFE8',     // colors.green.bg
  groundInner: '#DCEADF',// colors.green.leafFaint
  // Herbe
  grass: '#7FB089',      // colors.green.leaf
  grassLight: '#B8D6BD', // colors.green.leafLight
  // Rose — DA pink
  pink: '#F3C8D2',       // colors.pink.bg
  pinkDeep: '#E0A0B4',   // mid-tone rose
  pinkCore: '#E9B85E',   // colors.amber.border
  pinkBud: '#E8B8C4',
  // Tournesol — DA amber
  yellow: '#F7DCA0',
  yellowDeep: '#E9B85E', // colors.amber.border
  yellowCore: '#9A6F2E', // colors.amber.text
  yellowBud: '#EDD8A0',
  // Tulipe — DA coral
  tulipRed: '#D98A5A',   // colors.coral.barStrong
  tulipRedDeep: '#C47048',
  tulipBud: '#DCA080',
  // Lavande — violet chaud assourdi
  lavender: '#B8A8C8',
  lavenderDeep: '#9080A8',
  lavenderBud: '#C0B0C8',
  // Marguerite — DA surface/sable
  daisy: '#FBFBF6',      // colors.green.surface
  daisyCore: '#E9B85E',  // colors.amber.border
  daisyBud: '#F3F0E9',   // colors.sand.bg
  // Corail — DA coral/amber
  coral: '#D98A5A',      // colors.coral.barStrong
  coralDeep: '#C47048',
  coralCore: '#9A6F2E',  // colors.amber.text
  coralBud: '#DCAA88',
  // Pollen — DA amber
  pollen: '#E9B85E',     // colors.amber.border
  // Papillon — lavande chaude
  butterfly: '#9080A8',
  butterflyWing: '#C8B8D8',
  // Abeille — DA amber
  bee: '#E9B85E',        // colors.amber.border
  beeWing: '#FBF1DA',    // colors.amber.bg
  // Eclats — DA surface
  sparkle: '#FBFBF6',    // colors.green.surface
}

const WIND = [
  { dur: '3.2s', delay: '0s', angle: 6 },
  { dur: '3.8s', delay: '0.4s', angle: 7 },
  { dur: '3.0s', delay: '0.9s', angle: 5 },
  { dur: '3.5s', delay: '0.2s', angle: 7.5 },
  { dur: '4.0s', delay: '0.7s', angle: 5.5 },
  { dur: '3.3s', delay: '1.1s', angle: 6.5 },
  { dur: '3.6s', delay: '0.3s', angle: 4.5 },
]

const GRASS_POS = [
  { x: 15, h: 6, l: -2.2 }, { x: 28, h: 4.5, l: 1.5 },
  { x: 52, h: 5, l: -1.2 }, { x: 78, h: 6.5, l: 1.8 },
  { x: 105, h: 5, l: -1.8 }, { x: 128, h: 5.5, l: 1.3 },
  { x: 155, h: 6, l: -1.6 }, { x: 175, h: 4.5, l: 2 },
  { x: 200, h: 5.5, l: -1 }, { x: 225, h: 6, l: 1.5 },
  { x: 248, h: 5, l: -2 }, { x: 270, h: 5.5, l: 1.2 },
  { x: 285, h: 4.5, l: -1.5 },
]

const POLLEN_CFG = [
  { x: 55, delay: '0s', dur: '9s', drift: 8 },
  { x: 110, delay: '2.5s', dur: '11s', drift: -6 },
  { x: 170, delay: '5s', dur: '8s', drift: 10 },
  { x: 220, delay: '1.5s', dur: '10s', drift: -8 },
  { x: 85, delay: '4s', dur: '12s', drift: 5 },
  { x: 140, delay: '6.5s', dur: '10s', drift: -5 },
  { x: 250, delay: '3s', dur: '9s', drift: 7 },
]

const EXTRA_POLLEN_CFG = [
  { x: 30, delay: '1s', dur: '10s', drift: 6 },
  { x: 200, delay: '3.5s', dur: '8.5s', drift: -7 },
  { x: 130, delay: '0.5s', dur: '11.5s', drift: 9 },
  { x: 260, delay: '2s', dur: '9.5s', drift: -5 },
  { x: 70, delay: '5.5s', dur: '10.5s', drift: 4 },
  { x: 180, delay: '4.5s', dur: '7.5s', drift: -8 },
  { x: 240, delay: '1.5s', dur: '12s', drift: 6 },
]

const SVG_STYLE = `
.pg-plant{transform-box:fill-box;transform-origin:center bottom;animation:pgGrow .9s cubic-bezier(.34,1.56,.64,1) both}
@keyframes pgGrow{0%{transform:scaleY(0);opacity:0}40%{opacity:1}100%{transform:scaleY(1)}}
.pg-bloom{transform-box:fill-box;transform-origin:center center;animation:pgBloom 1.2s cubic-bezier(.34,1.56,.64,1) both}
@keyframes pgBloom{0%{transform:scale(0);opacity:0}50%{opacity:1}100%{transform:scale(1)}}
.pg-fadein{animation:pgFadeIn 1.5s ease both}
@keyframes pgFadeIn{0%{opacity:0}100%{opacity:1}}
`

// --- Time of day ---

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 6 && h < 8) return 'dawn'
  if (h >= 8 && h < 18) return 'day'
  if (h >= 18 && h < 20) return 'dusk'
  return 'night'
}

const SKY_GRADIENTS = {
  dawn:  { top: '#B8CCB8', mid: '#E8C8B8', bot: '#F0DCC8' },
  day:   { top: '#C0D4C4', mid: '#D6E4D8', bot: '#E7EFE8' },
  dusk:  { top: '#7A6850', mid: '#D09060', bot: '#E9B85E' },
  night: { top: '#1C2824', mid: '#2C3834', bot: '#3C4840' },
}

const HILL_COLORS = {
  dawn:  ['#D0DCC4', '#C0D0B4'],
  day:   ['#DCEADF', '#D0DCD0'],   // colors.green.leafFaint
  dusk:  ['#8A7860', '#786850'],
  night: ['#2A3830', '#223028'],
}

// --- Astres : Soleil & Lune ---

function getMoonPhase() {
  // Reference : nouvelle lune connue du 6 janvier 2000 a 18:14 UTC
  const ref = new Date('2000-01-06T18:14:00Z').getTime()
  const synodic = 29.53059 // jours du cycle synodique
  const age = (((Date.now() - ref) / 86400000) % synodic + synodic) % synodic
  return age / synodic // 0 = nouvelle lune, 0.5 = pleine lune
}

function CelestialSun({ timeOfDay, weather }) {
  const cx = timeOfDay === 'dawn' ? 248 : 260
  const cy = timeOfDay === 'dawn' ? 38 : 22
  const isClear = !weather || weather.type === 'clear'
  const opacity = isClear ? 1 : 0.35
  return (
    <g className="pg-fadein" opacity={opacity}>
      <circle cx={cx} cy={cy} r={14} fill="#FBF1DA" opacity="0.25">
        <animate attributeName="r" values="14;17;14" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.18;0.35;0.18" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={8} fill="#F7DCA0" opacity="0.45" />
      <circle cx={cx} cy={cy} r={5} fill="#E9B85E" opacity="0.55" />
      {isClear && [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180
        return (
          <line key={a}
            x1={cx + 10 * Math.cos(rad)} y1={cy + 10 * Math.sin(rad)}
            x2={cx + 15 * Math.cos(rad)} y2={cy + 15 * Math.sin(rad)}
            stroke="#E9B85E" strokeWidth="0.6" strokeLinecap="round" opacity="0.3">
            <animate attributeName="opacity" values="0.2;0.45;0.2" dur="3s"
              begin={`${a / 360}s`} repeatCount="indefinite" />
          </line>
        )
      })}
    </g>
  )
}

function CelestialMoon({ timeOfDay }) {
  const phase = getMoonPhase()
  const cx = timeOfDay === 'dusk' ? 50 : 40
  const cy = timeOfDay === 'dusk' ? 34 : 22
  const r = 9

  // Illumination : 0 a nouvelle lune, 1 a pleine lune
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2
  // Facteur de courbure du terminateur
  const k = -Math.cos(phase * 2 * Math.PI)

  // Nouvelle lune : juste un contour subtil
  if (illum < 0.02) {
    return (
      <g className="pg-fadein">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FBF1DA" strokeWidth="0.4" opacity="0.15" />
      </g>
    )
  }

  // Construction du chemin eclaire via deux arcs
  const waxing = phase <= 0.5
  const tRx = Math.abs(k) * r
  const top = `${cx},${cy - r}`
  const bot = `${cx},${cy + r}`
  let litPath
  if (waxing) {
    const tSweep = k >= 0 ? 0 : 1
    litPath = `M${top} A${r},${r} 0 0,1 ${bot} A${tRx},${r} 0 0,${tSweep} ${top}Z`
  } else {
    const tSweep = k >= 0 ? 1 : 0
    litPath = `M${top} A${r},${r} 0 0,0 ${bot} A${tRx},${r} 0 0,${tSweep} ${top}Z`
  }

  const glowR = r + 2 + illum * 4
  const glowOpacity = 0.04 + illum * 0.14

  return (
    <g className="pg-fadein">
      {/* Halo */}
      <circle cx={cx} cy={cy} r={glowR} fill="#FBF1DA" opacity={glowOpacity}>
        <animate attributeName="opacity" values={`${glowOpacity * 0.7};${glowOpacity};${glowOpacity * 0.7}`}
          dur="6s" repeatCount="indefinite" />
      </circle>
      {/* Base sombre (disque toujours visible) */}
      <circle cx={cx} cy={cy} r={r} fill="#FBF1DA" opacity="0.06" />
      {/* Partie eclairee */}
      <path d={litPath} fill="#FBF1DA" opacity={0.65 + illum * 0.3} />
      {/* Crateres (pleine lune / gibbeuse) */}
      {illum > 0.55 && <>
        <circle cx={cx - 2} cy={cy - 1.5} r={1.3} fill="#E9B85E" opacity={0.08 * illum} />
        <circle cx={cx + 2.5} cy={cy + 2} r={0.9} fill="#E9B85E" opacity={0.06 * illum} />
        <circle cx={cx - 0.5} cy={cy + 3} r={1} fill="#E9B85E" opacity={0.05 * illum} />
      </>}
    </g>
  )
}

// --- Phase 1 : Sky & Atmosphere ---

function SkyGradientDefs({ timeOfDay }) {
  const g = SKY_GRADIENTS[timeOfDay]
  return (
    <>
      <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={g.top} />
        <stop offset="55%" stopColor={g.mid} />
        <stop offset="100%" stopColor={g.bot} />
      </linearGradient>
      <linearGradient id="ground-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.ground} />
        <stop offset="60%" stopColor={C.groundInner} />
        <stop offset="100%" stopColor="#D0DCD2" />
      </linearGradient>
      <radialGradient id="harvest-glow" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor="#E9B85E" stopOpacity="0.18" />
        <stop offset="70%" stopColor="#E9B85E" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#E9B85E" stopOpacity="0" />
      </radialGradient>
    </>
  )
}

function SkyBackground({ timeOfDay }) {
  return <rect x="0" y="0" width="300" height="190" fill="url(#sky-gradient)" />
}

function DistantHills({ timeOfDay }) {
  const cols = HILL_COLORS[timeOfDay]
  return (
    <g className="pg-fadein">
      <path d="M0 140Q40 118 80 130Q120 115 160 128Q200 112 240 125Q280 118 300 132L300 190L0 190Z"
        fill={cols[0]} opacity="0.3" />
      <path d="M0 145Q50 128 100 138Q150 122 200 135Q250 125 300 140L300 190L0 190Z"
        fill={cols[1]} opacity="0.25" />
    </g>
  )
}

function Stars() {
  const stars = [
    { x: 25, y: 12, r: 0.8, d: '0s' }, { x: 68, y: 28, r: 0.6, d: '0.8s' },
    { x: 112, y: 8, r: 0.9, d: '1.5s' }, { x: 155, y: 35, r: 0.5, d: '0.3s' },
    { x: 198, y: 15, r: 0.7, d: '2s' }, { x: 240, y: 42, r: 0.6, d: '1.2s' },
    { x: 278, y: 10, r: 0.8, d: '0.6s' }, { x: 45, y: 50, r: 0.5, d: '1.8s' },
    { x: 130, y: 55, r: 0.7, d: '2.5s' }, { x: 210, y: 60, r: 0.5, d: '0.4s' },
  ]
  return (
    <g className="pg-fadein">
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity="0.5">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2.5 + (i % 3) * 0.8}s`}
            begin={s.d} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function Fireflies() {
  const flies = [
    { x: 40, y: 70, dx: 12, dy: -8, dur: '6s', d: '0s' },
    { x: 130, y: 85, dx: -10, dy: -12, dur: '8s', d: '1s' },
    { x: 220, y: 60, dx: 8, dy: 10, dur: '7s', d: '2.5s' },
    { x: 90, y: 95, dx: -6, dy: -10, dur: '9s', d: '0.5s' },
    { x: 260, y: 80, dx: -14, dy: -6, dur: '7.5s', d: '1.8s' },
  ]
  return (
    <g className="pg-fadein">
      {flies.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={1.2} fill="#F7DCA0" opacity="0">
          <animate attributeName="cx" values={`${f.x};${f.x + f.dx};${f.x}`}
            dur={f.dur} begin={f.d} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${f.y};${f.y + f.dy};${f.y}`}
            dur={f.dur} begin={f.d} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0.3;0.8;0"
            dur={f.dur} begin={f.d} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

// --- Phase 2 : Sol enrichi ---

function EnrichedGround({ days }) {
  return (
    <g>
      {/* Terrain principal — forme organique bord a bord */}
      <path d="M0 158C20 152 50 148 80 150C110 152 130 146 150 148C170 150 200 144 230 148C260 152 285 150 300 154L300 190L0 190Z"
        fill="url(#ground-gradient)" />
      {/* Couche intermediaire terre — irreguliere */}
      <path d="M10 162C40 156 70 154 100 156C130 158 155 152 180 154C210 156 240 152 280 158L290 190L10 190Z"
        fill="#D0DCD2" opacity="0.4" />
      {/* Couche interieure mousse — organique */}
      <path d="M30 166C60 160 90 158 120 161C150 164 175 158 210 160C240 162 265 160 275 164L270 190L30 190Z"
        fill="#B8D6BD" opacity="0.25" />

      {/* Mousse dispersee — taches organiques */}
      <ellipse cx="18" cy="166" rx="14" ry="4" fill="#B8D6BD" opacity="0.15" />
      <ellipse cx="280" cy="164" rx="12" ry="3.5" fill="#7FB089" opacity="0.13" />
      <ellipse cx="95" cy="168" rx="10" ry="3" fill="#B8D6BD" opacity="0.12" />
      <ellipse cx="200" cy="167" rx="8" ry="2.5" fill="#7FB089" opacity="0.1" />

      {/* Petits cailloux — toujours visibles */}
      <ellipse cx="60" cy="162" rx="2.2" ry="1.2" fill="#A8A294" opacity="0.35" />
      <ellipse cx="200" cy="164" rx="1.8" ry="1" fill="#8A8576" opacity="0.3" />
      <ellipse cx="245" cy="161" rx="2.5" ry="1.1" fill="#A8A294" opacity="0.3" />
      <ellipse cx="120" cy="166" rx="1.5" ry="0.9" fill="#8A8576" opacity="0.25" />

      {/* Feuilles tombees — jour 2+ */}
      {days >= 2 && <>
        <path d="M42 163Q45 159 48 162Q45 164 42 163Z" fill="#E9B85E" opacity="0.25" />
        <path d="M228 165Q231 161 234 164Q231 166 228 165Z" fill="#9A6F2E" opacity="0.2" />
        <path d="M168 167Q171 163 174 166Q171 168 168 167Z" fill="#E9B85E" opacity="0.18" />
      </>}

      {/* Champignons — jour 4+ */}
      {days >= 4 && <>
        <g opacity="0.4">
          <rect x="23" y="157" width="1.2" height="4" rx="0.5" fill="#A8A294" />
          <ellipse cx="23.6" cy="157" rx="3" ry="2" fill="#F3F0E9" />
          <ellipse cx="23.6" cy="157.2" rx="2.5" ry="1.2" fill="#FBFBF6" opacity="0.5" />
        </g>
        <g opacity="0.35">
          <rect x="273" y="159" width="1" height="3.5" rx="0.4" fill="#A8A294" />
          <ellipse cx="273.5" cy="159" rx="2.5" ry="1.8" fill="#F3F0E9" />
          <ellipse cx="273.5" cy="159.2" rx="2" ry="1" fill="#FBFBF6" opacity="0.5" />
        </g>
      </>}

      {/* Trefles — jour 1+ */}
      {days >= 1 && <>
        <g opacity="0.35">
          {[0, 120, 240].map((a, i) => {
            const rad = (a * Math.PI) / 180
            return <ellipse key={i} cx={75 + 2.5 * Math.cos(rad)} cy={164 + 2.5 * Math.sin(rad)}
              rx="1.8" ry="1.8" fill="#7FB089" />
          })}
        </g>
        <g opacity="0.3">
          {[0, 120, 240].map((a, i) => {
            const rad = (a * Math.PI) / 180
            return <ellipse key={i} cx={215 + 2.2 * Math.cos(rad)} cy={166 + 2.2 * Math.sin(rad)}
              rx="1.5" ry="1.5" fill="#5A8262" />
          })}
        </g>
        <g opacity="0.25">
          {[0, 120, 240].map((a, i) => {
            const rad = (a * Math.PI) / 180
            return <ellipse key={i} cx={145 + 2 * Math.cos(rad)} cy={168 + 2 * Math.sin(rad)}
              rx="1.4" ry="1.4" fill="#7FB089" />
          })}
        </g>
      </>}
    </g>
  )
}

// --- Phase 3 : Ombres des plantes ---

function PlantShadow({ x, maturity }) {
  const rx = maturity === 0 ? 4 : maturity === 1 ? 7 : 10
  return (
    <ellipse cx={x} cy="162" rx={rx} ry={1.8} fill="#3A4A3E"
      opacity={maturity === 0 ? 0.06 : maturity === 1 ? 0.08 : 0.1} />
  )
}

// --- Phase 3 : Faune progressive ---

function Ladybug() {
  return (
    <g opacity="0.6" className="pg-fadein" style={{ animationDelay: '1.5s' }}>
      <animateMotion path="M60,161L100,161L60,161" dur="20s" repeatCount="indefinite" />
      {/* Corps */}
      <ellipse cx="0" cy="0" rx="2.5" ry="2" fill="#C46040" />
      {/* Tete */}
      <ellipse cx="-2.8" cy="0" rx="1.2" ry="1.1" fill="#2E2E2E" />
      {/* Ligne centrale */}
      <line x1="0" y1="-2" x2="0" y2="2" stroke="#2E2E2E" strokeWidth="0.3" />
      {/* Points */}
      <circle cx="-0.8" cy="-0.7" r="0.5" fill="#2E2E2E" />
      <circle cx="0.8" cy="0.6" r="0.5" fill="#2E2E2E" />
      <circle cx="1.2" cy="-0.4" r="0.4" fill="#2E2E2E" />
      {/* Antennes */}
      <line x1="-3.5" y1="-0.5" x2="-4.5" y2="-2" stroke="#2E2E2E" strokeWidth="0.2" />
      <line x1="-3.5" y1="0.5" x2="-4.5" y2="2" stroke="#2E2E2E" strokeWidth="0.2" />
    </g>
  )
}

function Dragonfly() {
  return (
    <g opacity="0.45" className="pg-fadein" style={{ animationDelay: '3s' }}>
      <animateMotion
        path="M240,55C200,40 160,65 120,45C160,35 200,60 240,55"
        dur="16s" rotate="auto" repeatCount="indefinite" />
      {/* Corps */}
      <ellipse cx="0" cy="0" rx="0.6" ry="4" fill="#5A8262" />
      {/* Queue */}
      <line x1="0" y1="4" x2="0" y2="9" stroke="#5A8262" strokeWidth="0.6" strokeLinecap="round" />
      {/* Ailes gauche */}
      <ellipse cx="-4" cy="-1" rx="5" ry="1.2" fill="#DCEADF" opacity="0.35"
        transform="rotate(-10 -4 -1)">
        <animate attributeName="opacity" values="0.25;0.45;0.25" dur="0.8s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="-3.5" cy="1.5" rx="4" ry="1" fill="#DCEADF" opacity="0.3"
        transform="rotate(5 -3.5 1.5)">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="0.8s" begin="0.1s" repeatCount="indefinite" />
      </ellipse>
      {/* Ailes droit */}
      <ellipse cx="4" cy="-1" rx="5" ry="1.2" fill="#DCEADF" opacity="0.35"
        transform="rotate(10 4 -1)">
        <animate attributeName="opacity" values="0.25;0.45;0.25" dur="0.8s" begin="0.05s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="3.5" cy="1.5" rx="4" ry="1" fill="#DCEADF" opacity="0.3"
        transform="rotate(-5 3.5 1.5)">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
      </ellipse>
      {/* Yeux */}
      <circle cx="-1" cy="-4" r="0.6" fill="#3F6B49" />
      <circle cx="1" cy="-4" r="0.6" fill="#3F6B49" />
    </g>
  )
}

function SmallBird() {
  return (
    <g opacity="0.5" className="pg-fadein" style={{ animationDelay: '2.5s' }}>
      <animateMotion
        path="M20,40C80,25 150,50 220,30C280,45 220,55 150,35C80,50 20,40 20,40"
        dur="24s" rotate="auto" repeatCount="indefinite" />
      {/* Corps */}
      <ellipse cx="0" cy="0" rx="3" ry="2" fill="#8A8576" />
      {/* Tete */}
      <circle cx="-3.2" cy="-0.8" r="1.5" fill="#A8A294" />
      {/* Bec */}
      <path d="M-4.5,-1L-6,-0.8L-4.5,-0.4Z" fill="#E9B85E" />
      {/* Oeil */}
      <circle cx="-3.6" cy="-1.2" r="0.4" fill="#2E2E2E" />
      {/* Aile */}
      <path d="M0,-1.5Q3,-5 5,-2Q3,-0.5 0,-1.5Z" fill="#8A8576" opacity="0.7">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0 -1.5;-15 0 -1.5;0 0 -1.5" dur="0.4s" repeatCount="indefinite" />
      </path>
      {/* Queue */}
      <path d="M3,0Q5,2 6,-1Q4,-0.5 3,0Z" fill="#8A8576" opacity="0.6" />
    </g>
  )
}

// --- Phase 3 : Petales ---

function DriftingPetals() {
  const petals = [
    { x: 40, color: '#F3C8D2', dur: '12s', d: '0s', dx: 20, rot: 360 },
    { x: 120, color: '#F7DCA0', dur: '14s', d: '2s', dx: -15, rot: -270 },
    { x: 200, color: '#B8A8C8', dur: '11s', d: '4s', dx: 18, rot: 300 },
    { x: 260, color: '#D98A5A', dur: '13s', d: '1s', dx: -12, rot: -330 },
    { x: 80, color: '#FBFBF6', dur: '15s', d: '3s', dx: 14, rot: 280 },
  ]
  return (
    <g className="pg-fadein" style={{ animationDelay: '1s' }}>
      {petals.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={-5} rx={1.8} ry={1} fill={p.color} opacity="0">
          <animate attributeName="cy" values="-5;170" dur={p.dur} begin={p.d} repeatCount="indefinite" />
          <animate attributeName="cx" values={`${p.x};${p.x + p.dx}`} dur={p.dur} begin={p.d} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.5;0.4;0" dur={p.dur} begin={p.d} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="rotate"
            values={`0 ${p.x} -5;${p.rot} ${p.x + p.dx} 170`} dur={p.dur} begin={p.d} repeatCount="indefinite" />
        </ellipse>
      ))}
    </g>
  )
}

// --- Phase 4 : Rosee ---

function DewDrops() {
  const drops = [
    { x: 65, y: 125 }, { x: 140, y: 118 }, { x: 210, y: 122 },
    { x: 100, y: 130 }, { x: 180, y: 115 },
  ]
  return (
    <g className="pg-fadein">
      {drops.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={1} fill="#EEF4EF" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3"
              dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={d.x - 0.3} cy={d.y - 0.4} r={0.3} fill="#FFFFFF" opacity="0.6" />
        </g>
      ))}
    </g>
  )
}

// --- Phase 5 : Recompenses jour 7 ---

function HarvestGlow() {
  return (
    <rect x="0" y="0" width="300" height="190" fill="url(#harvest-glow)" opacity="0.8">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
    </rect>
  )
}

function Rainbow() {
  const bands = [
    { r: 90, color: '#D98A5A', w: 2 },   // coral
    { r: 87, color: '#E9B85E', w: 2 },   // amber
    { r: 84, color: '#F7DCA0', w: 2 },   // yellow
    { r: 81, color: '#7FB089', w: 2 },   // leaf
    { r: 78, color: '#B8D6BD', w: 2 },   // leafLight
    { r: 75, color: '#B8A8C8', w: 2 },   // lavender
  ]
  return (
    <g opacity="0.12" className="pg-fadein" style={{ animationDelay: '0.5s' }}>
      {bands.map((b, i) => (
        <path key={i}
          d={`M${150 - b.r} 130A${b.r} ${b.r} 0 0 1 ${150 + b.r} 130`}
          fill="none" stroke={b.color} strokeWidth={b.w} />
      ))}
    </g>
  )
}

function HarvestSparkles() {
  const sparkles = [
    { x: 30, y: 45, d: '0s' }, { x: 70, y: 25, d: '0.8s' },
    { x: 120, y: 50, d: '1.6s' }, { x: 180, y: 30, d: '0.4s' },
    { x: 230, y: 55, d: '1.2s' }, { x: 270, y: 40, d: '2s' },
    { x: 50, y: 70, d: '2.4s' }, { x: 150, y: 20, d: '1.8s' },
  ]
  return (
    <g>
      {sparkles.map((s, i) => (
        <g key={i} opacity="0">
          <animate attributeName="opacity" values="0;0.8;0" dur="3s" begin={s.d} repeatCount="indefinite" />
          <line x1={s.x - 2} y1={s.y} x2={s.x + 2} y2={s.y} stroke="#F7DCA0" strokeWidth="0.5" />
          <line x1={s.x} y1={s.y - 2} x2={s.x} y2={s.y + 2} stroke="#F7DCA0" strokeWidth="0.5" />
        </g>
      ))}
    </g>
  )
}

// --- Helpers ---

function CurvedStem({ h, color = C.stem, w = 2.2 }) {
  return (
    <path
      d={`M0 0C${0.03 * h} ${-h / 3} ${-0.025 * h} ${(-h * 2) / 3} 0 ${-h}`}
      stroke={color} strokeWidth={w} fill="none" strokeLinecap="round"
    />
  )
}

function Leaf({ y, size = 1, side = 'left', color = C.leafDark, wDur = '4.2s', wDelay = '0.5s' }) {
  const d = side === 'left' ? -1 : 1
  const s = size
  const tip = d * 10 * s
  return (
    <g>
      <animateTransform attributeName="transform" type="rotate"
        values={`0 0 ${y};${d * 3} 0 ${y};0 0 ${y}`}
        dur={wDur} begin={wDelay} repeatCount="indefinite" />
      <path
        d={`M0 ${y}C${d * 3 * s} ${y - 4 * s} ${d * 9 * s} ${y - 3 * s} ${tip} ${y - s}C${d * 9 * s} ${y + s} ${d * 3 * s} ${y + 2 * s} 0 ${y}Z`}
        fill={color}
      />
      <path
        d={`M0 ${y}Q${d * 5 * s} ${y - 1.5 * s} ${tip * 0.8} ${y - 0.8 * s}`}
        stroke={color === C.leafDark ? '#3F6B49' : '#5A8262'} strokeWidth="0.4" fill="none" opacity="0.5"
      />
    </g>
  )
}

function Petals({ cy, r, pr, fill, inner, count = 5, breathe = false }) {
  const out = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    const px = r * Math.cos(a), py = cy + r * Math.sin(a)
    out.push(
      <ellipse key={`o${i}`} cx={px} cy={py} rx={pr} ry={pr * 1.4}
        fill={fill} transform={`rotate(${(i / count) * 360} ${px} ${py})`}>
        {breathe && (
          <animate attributeName="rx" values={`${pr};${pr * 1.08};${pr}`}
            dur={`${3 + (i % 3) * 0.5}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
        )}
      </ellipse>
    )
  }
  if (inner) {
    const ic = Math.max(count - 1, 3)
    for (let i = 0; i < ic; i++) {
      const a = ((i + 0.5) / ic) * Math.PI * 2 - Math.PI / 2
      const px = r * 0.55 * Math.cos(a), py = cy + r * 0.55 * Math.sin(a)
      out.push(<ellipse key={`i${i}`} cx={px} cy={py} rx={pr * 0.6} ry={pr * 0.9}
        fill={inner} opacity="0.7" transform={`rotate(${((i + 0.5) / ic) * 360} ${px} ${py})`} />)
    }
  }
  return <>{out}</>
}

function Glow({ cy, r, color, dur = '3.5s' }) {
  return (
    <circle cx={0} cy={cy} r={r} fill={color} opacity="0.18">
      <animate attributeName="opacity" values="0.12;0.28;0.12" dur={dur} repeatCount="indefinite" />
      <animate attributeName="r" values={`${r - 1};${r + 1.5};${r - 1}`} dur={dur} repeatCount="indefinite" />
    </circle>
  )
}

function Sprout({ h }) {
  return (
    <g>
      <ellipse cx={0} cy={-h + 0.5} rx={1.8} ry={2.5} fill={C.leafDark} opacity="0.8">
        <animate attributeName="ry" values="2.5;3;2.5" dur="2.5s" repeatCount="indefinite" />
      </ellipse>
    </g>
  )
}

function Bud({ h, color }) {
  return (
    <g>
      <ellipse cx={0} cy={-h - 2} rx={2.2} ry={3.2} fill={color}>
        <animate attributeName="ry" values="3.2;3.6;3.2" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <path d={`M-1.5 ${-h - 0.5}Q0 ${-h - 4} 1.5 ${-h - 0.5}`} fill={C.leafDark} opacity="0.6" />
    </g>
  )
}

function FlowerSparkle({ cx, cy, delay = '0s' }) {
  return (
    <circle cx={cx} cy={cy} r={0.8} fill={C.sparkle} opacity="0">
      <animate attributeName="opacity" values="0;0.9;0" dur="2.5s" begin={delay} repeatCount="indefinite" />
      <animate attributeName="r" values="0.4;1.2;0.4" dur="2.5s" begin={delay} repeatCount="indefinite" />
    </circle>
  )
}

// --- 6 variantes ---

function Rose({ m, h }) {
  const t = -h - 1
  return (
    <>
      <CurvedStem h={h} />
      {m === 0 && <Sprout h={h} />}
      {m >= 1 && <>
        <Leaf y={-h + 8} size={0.9} side="left" wDur="4.2s" wDelay="0.3s" />
        <Leaf y={-h + 14} size={0.7} side="right" color={C.leafLight} wDur="4.8s" wDelay="0.8s" />
      </>}
      {m === 1 && <Bud h={h} color={C.pinkBud} />}
      {m >= 2 && <g className="pg-bloom">
        <Glow cy={t} r={7} color={C.pink} />
        <Petals cy={t} r={3.5} pr={2.8} fill={C.pink} inner={C.pinkDeep} count={5} breathe />
        <circle cx={0} cy={t} r={2} fill={C.pinkCore}>
          <animate attributeName="r" values="2;2.3;2" dur="3s" repeatCount="indefinite" />
        </circle>
        <FlowerSparkle cx={-3} cy={t - 3} delay="0.5s" />
        <FlowerSparkle cx={3} cy={t - 2} delay="1.8s" />
      </g>}
    </>
  )
}

function Lavender({ m, h }) {
  const t = -h
  return (
    <>
      <CurvedStem h={h} color={C.stemDark} w={2} />
      {m === 0 && <Sprout h={h} />}
      {m >= 1 && <>
        <Leaf y={t + 10} size={0.8} side="right" wDur="4.5s" wDelay="0.4s" />
        <Leaf y={t + 16} size={0.65} side="left" color={C.leafLight} wDur="5s" wDelay="0.9s" />
      </>}
      {m === 1 && <Bud h={h} color={C.lavenderBud} />}
      {m >= 2 && <g className="pg-bloom">
        <Glow cy={t - 5} r={6} color={C.lavender} dur="4s" />
        {[0, -3, -6, -8.5, -10.5].map((dy, i) => (
          <ellipse key={i} cx={i % 2 === 0 ? 0 : 0.3} cy={t + dy} rx={2.8 - i * 0.35} ry={2.2 - i * 0.25}
            fill={i % 2 === 0 ? C.lavender : C.lavenderDeep}>
            <animate attributeName="rx" values={`${2.8 - i * 0.35};${3 - i * 0.35};${2.8 - i * 0.35}`}
              dur={`${3 + i * 0.3}s`} begin={`${i * 0.15}s`} repeatCount="indefinite" />
          </ellipse>
        ))}
      </g>}
    </>
  )
}

function Sunflower({ m, h }) {
  const t = -h - 1
  return (
    <>
      <CurvedStem h={h} w={2.6} />
      {m === 0 && <Sprout h={h} />}
      {m >= 1 && <Leaf y={-h + 10} size={1.1} side="right" color={C.leafLight} wDur="4s" wDelay="0.6s" />}
      {m === 1 && <Bud h={h} color={C.yellowBud} />}
      {m >= 2 && <g className="pg-bloom">
        <Glow cy={t} r={9} color={C.yellow} dur="3s" />
        <Petals cy={t} r={4.2} pr={2.6} fill={C.yellow} inner={C.yellowDeep} count={8} breathe />
        <circle cx={0} cy={t} r={3.2} fill={C.yellowCore}>
          <animate attributeName="r" values="3.2;3.5;3.2" dur="4s" repeatCount="indefinite" />
        </circle>
        <FlowerSparkle cx={-4} cy={t - 4} delay="0.3s" />
        <FlowerSparkle cx={4} cy={t + 1} delay="2s" />
        <FlowerSparkle cx={0} cy={t - 5} delay="1.2s" />
      </g>}
    </>
  )
}

function Tulip({ m, h }) {
  const t = -h
  return (
    <>
      <CurvedStem h={h} w={2.3} />
      {m === 0 && <Sprout h={h} />}
      {m >= 1 && <Leaf y={t + 12} size={0.9} side="left" wDur="3.8s" wDelay="0.2s" />}
      {m === 1 && <Bud h={h} color={C.tulipBud} />}
      {m >= 2 && <g className="pg-bloom">
        <Glow cy={t - 3} r={8} color={C.tulipRed} dur="3.8s" />
        <ellipse cx={-3.5} cy={t - 3} rx={3.8} ry={5.8} fill={C.tulipRed}
          transform={`rotate(12 -3.5 ${t - 3})`}>
          <animate attributeName="ry" values="5.8;6.2;5.8" dur="3.5s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx={3.5} cy={t - 3} rx={3.8} ry={5.8} fill={C.tulipRedDeep}
          transform={`rotate(-12 3.5 ${t - 3})`}>
          <animate attributeName="ry" values="5.8;6.2;5.8" dur="3.5s" begin="0.3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx={0} cy={t - 4} rx={3} ry={5.2} fill={C.tulipRed} />
        <ellipse cx={-1.5} cy={t - 5} rx={1} ry={2} fill="#fff" opacity="0.12" />
      </g>}
    </>
  )
}

function Daisy({ m, h }) {
  const t = -h - 1
  return (
    <>
      <CurvedStem h={h} w={2} />
      {m === 0 && <Sprout h={h} />}
      {m >= 1 && <>
        <Leaf y={-h + 9} size={0.85} side="right" wDur="4.3s" wDelay="0.5s" />
        <Leaf y={-h + 15} size={0.6} side="left" color={C.leafLight} wDur="4.7s" wDelay="1s" />
      </>}
      {m === 1 && <Bud h={h} color={C.daisyBud} />}
      {m >= 2 && <g className="pg-bloom">
        <Glow cy={t} r={7.5} color={C.daisy} dur="4.2s" />
        <Petals cy={t} r={4} pr={2.6} fill={C.daisy} count={7} breathe />
        <circle cx={0} cy={t} r={2.5} fill={C.daisyCore}>
          <animate attributeName="r" values="2.5;2.8;2.5" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <FlowerSparkle cx={-3.5} cy={t - 3} delay="1s" />
        <FlowerSparkle cx={2.5} cy={t + 2} delay="2.3s" />
      </g>}
    </>
  )
}

function CoralF({ m, h }) {
  const t = -h - 1
  return (
    <>
      <CurvedStem h={h} color={C.stemDark} />
      {m === 0 && <Sprout h={h} />}
      {m >= 1 && <Leaf y={-h + 8} size={0.9} side="left" color={C.leafLight} wDur="4.4s" wDelay="0.7s" />}
      {m === 1 && <Bud h={h} color={C.coralBud} />}
      {m >= 2 && <g className="pg-bloom">
        <Glow cy={t} r={7} color={C.coral} dur="3.2s" />
        <Petals cy={t} r={3.4} pr={2.7} fill={C.coral} inner={C.coralDeep} count={6} breathe />
        <circle cx={0} cy={t} r={2} fill={C.coralCore}>
          <animate attributeName="r" values="2;2.3;2" dur="3s" repeatCount="indefinite" />
        </circle>
        <FlowerSparkle cx={3} cy={t - 2.5} delay="0.8s" />
      </g>}
    </>
  )
}

const VARIANTS = [Rose, Lavender, Sunflower, Tulip, Daisy, CoralF]

// --- Plante (wind + grow-in) ---
// Maturity per plant: progressive blooming from day 3
// plant index 0 (oldest) matures fastest, newest stays sprout/bud

function Plant({ x, index, maturity }) {
  const V = VARIANTS[index % VARIANTS.length]
  const h = maturity === 0 ? 22 : maturity === 1 ? 40 : 58
  const wind = WIND[index % WIND.length]
  return (
    <g transform={`translate(${x},160)`}>
      <g className="pg-plant" style={{ animationDelay: `${index * 0.15}s` }}>
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values={`0 0 0;${wind.angle} 0 0;0 0 0;${-wind.angle * 0.6} 0 0;0 0 0`}
            dur={wind.dur} begin={wind.delay} repeatCount="indefinite" />
          <V m={maturity} h={h} />
        </g>
      </g>
    </g>
  )
}

// --- Environnement ---

function GrassTufts() {
  return (
    <g>
      {GRASS_POS.map((g, i) => (
        <g key={i}>
          <animateTransform attributeName="transform" type="rotate"
            values={`0 ${g.x} 160;${g.l * 2} ${g.x} 160;0 ${g.x} 160`}
            dur={`${2.5 + (i % 3) * 0.5}s`} begin={`${(i % 5) * 0.3}s`} repeatCount="indefinite" />
          <path
            d={`M${g.x} 160Q${g.x + g.l} ${160 - g.h / 2} ${g.x + g.l * 0.6} ${160 - g.h}`}
            stroke={i % 2 === 0 ? C.grass : C.grassLight}
            strokeWidth="0.9" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

function PollenParticles({ extra = false }) {
  const cfg = extra ? [...POLLEN_CFG, ...EXTRA_POLLEN_CFG] : POLLEN_CFG
  return (
    <g>
      {cfg.map((p, i) => (
        <circle key={i} cx={p.x} cy={155} r={0.8} fill={C.pollen} opacity="0">
          <animate attributeName="cy" values="155;15" dur={p.dur} begin={p.delay} repeatCount="indefinite" />
          <animate attributeName="cx" values={`${p.x};${p.x + p.drift}`} dur={p.dur} begin={p.delay} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.65;0.5;0" dur={p.dur} begin={p.delay} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function Butterfly() {
  return (
    <g opacity="0.6">
      <animateMotion
        path="M40,65C120,35 200,80 270,50C200,35 120,80 40,65"
        dur="18s" rotate="auto" repeatCount="indefinite" />
      <ellipse cx="0" cy="0" rx="0.6" ry="1.8" fill={C.butterfly} />
      <path d="M-0.5,-0.8C-3.5,-4 -5,-1.5 -3,1C-4.5,0 -5,2.5 -1.5,2Z" fill={C.butterflyWing} opacity="0.6">
        <animateTransform attributeName="transform" type="rotate"
          values="0 -0.5 0;35 -0.5 0;0 -0.5 0" dur="0.3s" repeatCount="indefinite" />
      </path>
      <path d="M0.5,-0.8C3.5,-4 5,-1.5 3,1C4.5,0 5,2.5 1.5,2Z" fill={C.butterflyWing} opacity="0.6">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0.5 0;-35 0.5 0;0 0.5 0" dur="0.3s" repeatCount="indefinite" />
      </path>
      <line x1="-0.3" y1="-1.8" x2="-1.8" y2="-3.5" stroke={C.butterfly} strokeWidth="0.2" strokeLinecap="round" />
      <line x1="0.3" y1="-1.8" x2="1.8" y2="-3.5" stroke={C.butterfly} strokeWidth="0.2" strokeLinecap="round" />
      <circle cx="-1.8" cy="-3.5" r="0.3" fill={C.butterfly} />
      <circle cx="1.8" cy="-3.5" r="0.3" fill={C.butterfly} />
    </g>
  )
}

function Bee() {
  return (
    <g opacity="0.55" className="pg-fadein" style={{ animationDelay: '2s' }}>
      <animateMotion
        path="M200,75C160,45 100,90 60,55C100,40 160,80 200,75"
        dur="14s" rotate="auto" repeatCount="indefinite" />
      <ellipse cx="0" cy="0" rx="1.8" ry="1.2" fill={C.bee} />
      <line x1="-0.6" y1="0" x2="0.6" y2="0" stroke="#3A4A3E" strokeWidth="0.4" />
      <ellipse cx="-1" cy="-1.2" rx="1.4" ry="0.7" fill={C.beeWing} opacity="0.5"
        transform="rotate(-20 -1 -1.2)">
        <animateTransform attributeName="transform" type="rotate"
          values="-20 -1 -1.2;10 -1 -1.2;-20 -1 -1.2" dur="0.15s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="1" cy="-1.2" rx="1.4" ry="0.7" fill={C.beeWing} opacity="0.5"
        transform="rotate(20 1 -1.2)">
        <animateTransform attributeName="transform" type="rotate"
          values="20 1 -1.2;-10 1 -1.2;20 1 -1.2" dur="0.15s" repeatCount="indefinite" />
      </ellipse>
    </g>
  )
}

// --- Météo : décor dynamique ---

function WeatherClouds({ variant = 'light' }) {
  const opacity = variant === 'heavy' ? 0.55 : 0.3
  return (
    <g className="pg-fadein">
      {/* Nuage gauche */}
      <g opacity={opacity}>
        <ellipse cx="55" cy="22" rx="22" ry="9" fill="#E7EFE8" />
        <ellipse cx="42" cy="24" rx="14" ry="7" fill="#DCEADF" />
        <ellipse cx="68" cy="24" rx="16" ry="7.5" fill="#DCEADF" />
        <animateTransform attributeName="transform" type="translate"
          values="0,0;6,0;0,0" dur="12s" repeatCount="indefinite" />
      </g>
      {/* Nuage droit */}
      <g opacity={opacity * 0.85}>
        <ellipse cx="220" cy="16" rx="25" ry="10" fill="#E7EFE8" />
        <ellipse cx="205" cy="18" rx="15" ry="8" fill="#DCEADF" />
        <ellipse cx="238" cy="19" rx="18" ry="8" fill="#DCEADF" />
        <animateTransform attributeName="transform" type="translate"
          values="0,0;-5,0;0,0" dur="14s" repeatCount="indefinite" />
      </g>
      {variant === 'heavy' && (
        <g opacity={opacity * 0.7}>
          <ellipse cx="140" cy="12" rx="20" ry="8" fill="#D0DCD2" />
          <ellipse cx="128" cy="14" rx="12" ry="6" fill="#B8D6BD" />
          <ellipse cx="155" cy="14" rx="14" ry="7" fill="#B8D6BD" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;4,0;0,0" dur="10s" repeatCount="indefinite" />
        </g>
      )}
    </g>
  )
}

function WeatherRain() {
  const drops = [
    { x: 40, d: '0s' }, { x: 75, d: '0.3s' }, { x: 110, d: '0.7s' },
    { x: 145, d: '0.15s' }, { x: 180, d: '0.5s' }, { x: 215, d: '0.85s' },
    { x: 250, d: '0.4s' }, { x: 60, d: '0.6s' }, { x: 130, d: '0.2s' },
    { x: 195, d: '0.9s' }, { x: 265, d: '0.1s' }, { x: 90, d: '0.75s' },
  ]
  return (
    <g>
      <WeatherClouds variant="heavy" />
      {drops.map((r, i) => (
        <line key={i} x1={r.x} y1={30} x2={r.x - 3} y2={38}
          stroke="#9AA8A0" strokeWidth="0.8" strokeLinecap="round" opacity="0">
          <animate attributeName="y1" values="30;152" dur="1.4s" begin={r.d} repeatCount="indefinite" />
          <animate attributeName="y2" values="38;160" dur="1.4s" begin={r.d} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.5;0.4;0" dur="1.2s" begin={r.d} repeatCount="indefinite" />
        </line>
      ))}
    </g>
  )
}

function WeatherDrizzle() {
  const drops = [
    { x: 55, d: '0s' }, { x: 120, d: '0.4s' }, { x: 185, d: '0.8s' },
    { x: 250, d: '0.2s' }, { x: 90, d: '0.6s' }, { x: 155, d: '1s' },
  ]
  return (
    <g>
      <WeatherClouds variant="light" />
      {drops.map((r, i) => (
        <circle key={i} cx={r.x} cy={32} r={0.6} fill="#9AA8A0" opacity="0">
          <animate attributeName="cy" values="32;155" dur="2.2s" begin={r.d} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.4;0.3;0" dur="2s" begin={r.d} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function WeatherSnow() {
  const flakes = [
    { x: 45, d: '0s', dx: 5 }, { x: 90, d: '0.5s', dx: -3 },
    { x: 135, d: '1s', dx: 6 }, { x: 180, d: '0.3s', dx: -4 },
    { x: 225, d: '0.8s', dx: 5 }, { x: 270, d: '1.2s', dx: -6 },
    { x: 60, d: '0.6s', dx: 4 }, { x: 155, d: '0.2s', dx: -5 },
    { x: 205, d: '0.9s', dx: 3 }, { x: 115, d: '1.4s', dx: -4 },
  ]
  return (
    <g>
      <WeatherClouds variant="heavy" />
      {flakes.map((s, i) => (
        <circle key={i} cx={s.x} cy={20} r={1.2} fill="#fff" opacity="0">
          <animate attributeName="cy" values="20;158" dur="4.5s" begin={s.d} repeatCount="indefinite" />
          <animate attributeName="cx" values={`${s.x};${s.x + s.dx};${s.x + s.dx * 2}`}
            dur="4s" begin={s.d} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0.6;0" dur="4s" begin={s.d} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function WeatherFog() {
  return (
    <g className="pg-fadein">
      <rect x="0" y="80" width="300" height="100" fill="#E7EFE8" opacity="0.15">
        <animate attributeName="opacity" values="0.1;0.22;0.1" dur="6s" repeatCount="indefinite" />
      </rect>
      <line x1="20" y1="100" x2="280" y2="100" stroke="#DCEADF" strokeWidth="1.5" strokeLinecap="round" opacity="0.2">
        <animate attributeName="opacity" values="0.15;0.3;0.15" dur="5s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate"
          values="0,0;4,0;0,0" dur="8s" repeatCount="indefinite" />
      </line>
      <line x1="10" y1="120" x2="290" y2="120" stroke="#DCEADF" strokeWidth="1" strokeLinecap="round" opacity="0.15">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="7s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate"
          values="0,0;-3,0;0,0" dur="10s" repeatCount="indefinite" />
      </line>
    </g>
  )
}

function WeatherStorm() {
  return (
    <g>
      <WeatherRain />
      {/* Éclair */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;0;0.8;0;0;0;0.6;0;0;0;0;0;0;0;0;0;0;0;0;0"
          dur="6s" repeatCount="indefinite" />
        <path d="M148 8L142 24L150 22L144 38" fill="none"
          stroke="#F7DCA0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  )
}

function WeatherDecor({ weather }) {
  if (!weather) return null
  switch (weather.type) {
    case 'clear': return null // soleil gere par CelestialSun
    case 'cloudy': return <WeatherClouds variant="light" />
    case 'fog': return <WeatherFog />
    case 'drizzle': return <WeatherDrizzle />
    case 'rain': return <WeatherRain />
    case 'snow': return <WeatherSnow />
    case 'storm': return <WeatherStorm />
    default: return null
  }
}

// --- Composant principal ---

/**
 * Maturity per plant: progressive blooming.
 * - days < 3:  all sprouts (m=0)
 * - days 3-4:  oldest 1-2 plants get buds (m=1), rest sprouts
 * - days 5-6:  oldest plants bloom (m=2), middle buds, newest sprouts
 * - days >= 7: all bloom (m=2)
 */
function getPlantMaturity(plantIndex, plantCount, days) {
  if (days >= 7) return 2
  if (days < 3) return 0
  const age = plantCount - 1 - plantIndex
  const progress = days - 2
  const threshold = age * 1.2
  if (progress >= threshold + 2.5) return 2
  if (progress >= threshold + 1) return 1
  return 0
}

export default function GrowingGarden({ days = 0 }) {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    fetchWeather().then((w) => { if (w) setWeather(w) })
  }, [])

  const timeOfDay = getTimeOfDay()
  const plantCount = Math.min(days, 7)
  const hasFlowers = days >= 3
  const positions = Array.from({ length: plantCount }, (_, i) => {
    const spread = 240 / Math.max(plantCount, 1)
    return 35 + i * spread + ((i % 2) * 6 - 3)
  })

  return (
    <svg viewBox="0 0 300 190" style={{ width: '100%', display: 'block' }} role="img"
      aria-label={`Jardin de ${days} jour${days > 1 ? 's' : ''} suivi${days > 1 ? 's' : ''}`}>
      <style>{SVG_STYLE}</style>

      {/* Defs : gradients */}
      <defs>
        <SkyGradientDefs timeOfDay={timeOfDay} />
      </defs>

      {/* 1. Ciel */}
      <SkyBackground timeOfDay={timeOfDay} />

      {/* 2. Collines lointaines */}
      <DistantHills timeOfDay={timeOfDay} />

      {/* 3. Astres */}
      {(timeOfDay === 'dawn' || timeOfDay === 'day') && <CelestialSun timeOfDay={timeOfDay} weather={weather} />}
      {(timeOfDay === 'dusk' || timeOfDay === 'night') && <CelestialMoon timeOfDay={timeOfDay} />}

      {/* 4. Etoiles / lucioles */}
      {timeOfDay === 'night' && <Stars />}
      {timeOfDay === 'dusk' && <Fireflies />}

      {/* 5. Meteo */}
      <WeatherDecor weather={weather} />

      {/* 5. Sol enrichi + decorations */}
      <EnrichedGround days={days} />

      {/* 7. Ombres des plantes */}
      {positions.map((x, i) => (
        <PlantShadow key={`sh${i}`} x={x} maturity={getPlantMaturity(i, plantCount, days)} />
      ))}

      {/* 8. Herbe */}
      {plantCount > 0 && <GrassTufts />}

      {/* 9. Plantes */}
      {positions.map((x, i) => (
        <Plant key={i} x={x} index={i} maturity={getPlantMaturity(i, plantCount, days)} />
      ))}

      {/* 10. Rosee (dawn) */}
      {timeOfDay === 'dawn' && days >= 5 && <DewDrops />}

      {/* 11. Pollen + petales */}
      {hasFlowers && <PollenParticles extra={days >= 7} />}
      {days >= 5 && <DriftingPetals />}

      {/* 12. Faune */}
      {hasFlowers && <Butterfly />}
      {days >= 5 && <Bee />}
      {days >= 2 && <Ladybug />}
      {days >= 4 && <Dragonfly />}
      {days >= 6 && <SmallBird />}

      {/* 13. Halo de recolte (jour 7) */}
      {days >= 7 && <HarvestGlow />}
      {days >= 7 && <HarvestSparkles />}

      {/* 14. Arc-en-ciel (jour 7) */}
      {days >= 7 && <Rainbow />}

      {/* Message jour 0 */}
      {days === 0 && (
        <>
          <circle cx="150" cy="158" r="3" fill={C.stemDark} opacity="0.4" />
          <text x="150" y="85" textAnchor="middle" fontSize="13" fill="#9DAFA1" fontFamily="Nunito, sans-serif">
            Ton jardin attend sa premiere pousse
          </text>
        </>
      )}
    </svg>
  )
}
