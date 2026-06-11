// =============================================================
// GrowingGarden — le jardin qui pousse
//
// Animations : croissance organique, balancement au vent,
// respiration lumineuse, particules de pollen, papillon,
// herbe animée, progression bourgeon → bouton → fleur.
// Floraison progressive dès le jour 3.
// Props : days (nombre de jours distincts signalés)
// =============================================================

const C = {
  stem: '#86A98B', stemDark: '#6E8F74',
  leafDark: '#7FB089', leafLight: '#9FC4A4',
  ground: '#DCE8DD', groundInner: '#D0DCD2',
  grass: '#8DB896', grassLight: '#A8CBA9',
  pink: '#F3C8D2', pinkDeep: '#E89BAC', pinkCore: '#E9B85E', pinkBud: '#E8B0C0',
  yellow: '#F7DCA0', yellowDeep: '#ECC46A', yellowCore: '#D4960A', yellowBud: '#E8D090',
  tulipRed: '#E07070', tulipRedDeep: '#C45050', tulipBud: '#D08080',
  lavender: '#C4A8D8', lavenderDeep: '#9B7FB8', lavenderBud: '#B098C0',
  daisy: '#FFF8EE', daisyCore: '#E9B85E', daisyBud: '#F0E8D0',
  coral: '#F0A882', coralDeep: '#D98A5A', coralCore: '#C46E3E', coralBud: '#E0A080',
  pollen: '#F7E8A0',
  butterfly: '#B098C8', butterflyWing: '#D4C0E8',
  bee: '#E9B85E', beeWing: '#F7ECCC',
  sparkle: '#FFF8DD',
}

const WIND = [
  { dur: '3.2s', delay: '0s', angle: 2.8 },
  { dur: '3.8s', delay: '0.4s', angle: 3.2 },
  { dur: '3.0s', delay: '0.9s', angle: 2.2 },
  { dur: '3.5s', delay: '0.2s', angle: 3.5 },
  { dur: '4.0s', delay: '0.7s', angle: 2.5 },
  { dur: '3.3s', delay: '1.1s', angle: 3 },
  { dur: '3.6s', delay: '0.3s', angle: 2 },
]

const GRASS_POS = [
  { x: 15, h: 5, l: -1.2 }, { x: 28, h: 3.5, l: 0.8 },
  { x: 52, h: 4, l: -0.6 }, { x: 78, h: 5.5, l: 1 },
  { x: 105, h: 3.8, l: -1 }, { x: 128, h: 4.5, l: 0.7 },
  { x: 155, h: 5, l: -0.9 }, { x: 175, h: 3.5, l: 1.3 },
  { x: 200, h: 4.2, l: -0.5 }, { x: 225, h: 5, l: 0.8 },
  { x: 248, h: 3.8, l: -1.1 }, { x: 270, h: 4.5, l: 0.6 },
  { x: 285, h: 3.5, l: -0.8 },
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

const SVG_STYLE = `
.pg-plant{transform-box:fill-box;transform-origin:center bottom;animation:pgGrow .9s cubic-bezier(.34,1.56,.64,1) both}
@keyframes pgGrow{0%{transform:scaleY(0);opacity:0}40%{opacity:1}100%{transform:scaleY(1)}}
.pg-bloom{transform-box:fill-box;transform-origin:center center;animation:pgBloom 1.2s cubic-bezier(.34,1.56,.64,1) both}
@keyframes pgBloom{0%{transform:scale(0);opacity:0}50%{opacity:1}100%{transform:scale(1)}}
.pg-fadein{animation:pgFadeIn 1.5s ease both}
@keyframes pgFadeIn{0%{opacity:0}100%{opacity:1}}
`

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
        stroke={color === C.leafDark ? '#6E9A76' : '#8BB896'} strokeWidth="0.4" fill="none" opacity="0.5"
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
  const h = maturity === 0 ? 14 : maturity === 1 ? 22 : 30
  const wind = WIND[index % WIND.length]
  return (
    <g transform={`translate(${x},86)`}>
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
            values={`0 ${g.x} 86;${g.l * 1.5} ${g.x} 86;0 ${g.x} 86`}
            dur={`${2.5 + (i % 3) * 0.5}s`} begin={`${(i % 5) * 0.3}s`} repeatCount="indefinite" />
          <path
            d={`M${g.x} 86Q${g.x + g.l} ${86 - g.h / 2} ${g.x + g.l * 0.6} ${86 - g.h}`}
            stroke={i % 2 === 0 ? C.grass : C.grassLight}
            strokeWidth="0.7" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

function PollenParticles() {
  return (
    <g>
      {POLLEN_CFG.map((p, i) => (
        <circle key={i} cx={p.x} cy={82} r={0.7} fill={C.pollen} opacity="0">
          <animate attributeName="cy" values="82;28" dur={p.dur} begin={p.delay} repeatCount="indefinite" />
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
        path="M40,40C120,22 200,55 270,35C200,22 120,55 40,40"
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
        path="M200,50C160,30 100,60 60,38C100,25 160,55 200,50"
        dur="14s" rotate="auto" repeatCount="indefinite" />
      <ellipse cx="0" cy="0" rx="1.8" ry="1.2" fill={C.bee} />
      <line x1="-0.6" y1="0" x2="0.6" y2="0" stroke="#2E4034" strokeWidth="0.4" />
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
  // Age: 0 = oldest, plantCount-1 = newest
  const age = plantCount - 1 - plantIndex
  // How many "maturity points" to distribute
  const progress = days - 2 // 1 at day 3, 2 at day 4, etc.
  // Oldest plants bloom first: each plant needs ~1.5 progress points per maturity level
  const threshold = age * 1.2
  if (progress >= threshold + 2.5) return 2
  if (progress >= threshold + 1) return 1
  return 0
}

export default function GrowingGarden({ days = 0 }) {
  const plantCount = Math.min(days, 7)
  const hasFlowers = days >= 3
  const positions = Array.from({ length: plantCount }, (_, i) => {
    const spread = 240 / Math.max(plantCount, 1)
    return 35 + i * spread + ((i % 2) * 6 - 3)
  })

  return (
    <svg viewBox="0 0 300 100" style={{ width: '100%' }} role="img"
      aria-label={`Jardin de ${days} jour${days > 1 ? 's' : ''} suivi${days > 1 ? 's' : ''}`}>
      <style>{SVG_STYLE}</style>

      <ellipse cx="150" cy="88" rx="142" ry="14" fill={C.ground} />
      <ellipse cx="150" cy="89" rx="128" ry="10" fill={C.groundInner} opacity="0.5" />

      {plantCount > 0 && <GrassTufts />}

      {positions.map((x, i) => (
        <Plant key={i} x={x} index={i} maturity={getPlantMaturity(i, plantCount, days)} />
      ))}

      {hasFlowers && <PollenParticles />}
      {hasFlowers && <Butterfly />}
      {days >= 5 && <Bee />}

      {days === 0 && (
        <>
          <circle cx="150" cy="85" r="2" fill={C.stemDark} opacity="0.3" />
          <text x="150" y="48" textAnchor="middle" fontSize="11" fill="#9DAFA1" fontFamily="Nunito, sans-serif">
            Ton jardin attend sa premiere pousse
          </text>
        </>
      )}
    </svg>
  )
}
