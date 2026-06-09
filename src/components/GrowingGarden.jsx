// =============================================================
// GrowingGarden — le jardin qui pousse
// Chaque jour signalé fait apparaître une plante. Plus il y a de
// jours suivis, plus le jardin est fourni (3 paliers de maturité).
// 6 variantes de plantes avec fleurs detaillees.
// Animation douce de balancement au vent.
// Props : days (nombre de jours distincts signalés)
// =============================================================

const C = {
  stem: '#86A98B',
  stemDark: '#6E8F74',
  leafDark: '#7FB089',
  leafLight: '#9FC4A4',
  // Fleur rose (petales)
  pink: '#F3C8D2',
  pinkDeep: '#E89BAC',
  pinkCore: '#E9B85E',
  // Fleur jaune tournesol
  yellow: '#F7DCA0',
  yellowDeep: '#ECC46A',
  yellowCore: '#D4960A',
  // Tulipe rouge
  tulipRed: '#E07070',
  tulipRedDeep: '#C45050',
  // Lavande
  lavender: '#C4A8D8',
  lavenderDeep: '#9B7FB8',
  // Marguerite blanche
  daisy: '#FFF8EE',
  daisyCore: '#E9B85E',
  // Fleur corail
  coral: '#F0A882',
  coralDeep: '#D98A5A',
  coralCore: '#C46E3E',
}

// Parametres de vent par plante
const WIND_PARAMS = [
  { dur: '3.2s', delay: '0s', angle: 2.5 },
  { dur: '3.8s', delay: '0.4s', angle: 3 },
  { dur: '3.0s', delay: '0.9s', angle: 2 },
  { dur: '3.5s', delay: '0.2s', angle: 3.5 },
  { dur: '4.0s', delay: '0.7s', angle: 2.5 },
  { dur: '3.3s', delay: '1.1s', angle: 3 },
  { dur: '3.6s', delay: '0.3s', angle: 2 },
  { dur: '3.1s', delay: '0.8s', angle: 3.5 },
  { dur: '3.9s', delay: '0.1s', angle: 2.5 },
  { dur: '3.4s', delay: '0.6s', angle: 3 },
  { dur: '3.7s', delay: '1.0s', angle: 2 },
  { dur: '3.2s', delay: '0.5s', angle: 3.5 },
]

/** 5 petales disposes en cercle */
function Petals({ cx, cy, r, petalR, fill, count = 5 }) {
  const petals = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const px = cx + r * Math.cos(angle)
    const py = cy + r * Math.sin(angle)
    petals.push(<ellipse key={i} cx={px} cy={py} rx={petalR} ry={petalR * 1.4}
      fill={fill} transform={`rotate(${(i / count) * 360} ${px} ${py})`} />)
  }
  return <>{petals}</>
}

function Plant({ x, index, maturity }) {
  const variant = index % 6
  const baseY = 86
  const wind = WIND_PARAMS[index % WIND_PARAMS.length]

  const sway = (
    <animateTransform
      attributeName="transform"
      type="rotate"
      values={`0 ${x} ${baseY}; ${wind.angle} ${x} ${baseY}; 0 ${x} ${baseY}; ${-wind.angle * 0.6} ${x} ${baseY}; 0 ${x} ${baseY}`}
      dur={wind.dur}
      begin={wind.delay}
      repeatCount="indefinite"
    />
  )

  // Hauteurs par maturite
  const h = maturity === 0 ? 14 : maturity === 1 ? 22 : 30

  // --- Variant 0 : fleur rose a 5 petales ---
  if (variant === 0) {
    const top = baseY - h - 1
    return (
      <g>
        {sway}
        <rect x={x - 1} y={baseY - h} width="2.4" height={h} fill={C.stem} rx="1" />
        {maturity >= 1 && (
          <path d={`M${x} ${baseY - h + 8} C${x} ${baseY - h + 2} ${x - 8} ${baseY - h} ${x - 11} ${baseY - h + 2} C${x - 8} ${baseY - h + 7} ${x - 3} ${baseY - h + 9} ${x} ${baseY - h + 8} Z`} fill={C.leafDark} />
        )}
        {maturity >= 2 && (
          <g>
            <Petals cx={x} cy={top} r={3.5} petalR={2.8} fill={C.pink} count={5} />
            <circle cx={x} cy={top} r="2.2" fill={C.pinkCore} />
          </g>
        )}
      </g>
    )
  }

  // --- Variant 1 : lavande (epis violet) ---
  if (variant === 1) {
    const top = baseY - h
    return (
      <g>
        {sway}
        <rect x={x - 1} y={top} width="2.2" height={h} fill={C.stemDark} rx="1" />
        {maturity >= 1 && (
          <>
            <path d={`M${x} ${top + 10} C${x} ${top + 5} ${x + 7} ${top + 3} ${x + 10} ${top + 5} C${x + 7} ${top + 9} ${x + 3} ${top + 11} ${x} ${top + 10} Z`} fill={C.leafDark} />
            <path d={`M${x} ${top + 16} C${x} ${top + 11} ${x - 6} ${top + 9} ${x - 9} ${top + 11} C${x - 6} ${top + 15} ${x - 3} ${top + 17} ${x} ${top + 16} Z`} fill={C.leafLight} />
          </>
        )}
        {maturity >= 2 && (
          <g>
            {/* Epi de lavande — petits ovales empiles */}
            <ellipse cx={x} cy={top - 1} rx="2.5" ry="2" fill={C.lavender} />
            <ellipse cx={x} cy={top - 4} rx="2.2" ry="1.8" fill={C.lavenderDeep} />
            <ellipse cx={x} cy={top - 7} rx="1.8" ry="1.5" fill={C.lavender} />
            <ellipse cx={x} cy={top - 9.5} rx="1.3" ry="1.2" fill={C.lavenderDeep} />
          </g>
        )}
      </g>
    )
  }

  // --- Variant 2 : tournesol jaune ---
  if (variant === 2) {
    const top = baseY - h - 1
    return (
      <g>
        {sway}
        <rect x={x - 1.2} y={baseY - h} width="2.6" height={h} fill={C.stem} rx="1" />
        {maturity >= 1 && (
          <path d={`M${x} ${baseY - h + 10} C${x} ${baseY - h + 4} ${x + 8} ${baseY - h + 2} ${x + 11} ${baseY - h + 4} C${x + 8} ${baseY - h + 9} ${x + 3} ${baseY - h + 11} ${x} ${baseY - h + 10} Z`} fill={C.leafLight} />
        )}
        {maturity >= 2 && (
          <g>
            <Petals cx={x} cy={top} r={4} petalR={2.5} fill={C.yellow} count={8} />
            <circle cx={x} cy={top} r="3" fill={C.yellowCore} />
          </g>
        )}
      </g>
    )
  }

  // --- Variant 3 : tulipe rouge ---
  if (variant === 3) {
    const top = baseY - h
    return (
      <g>
        {sway}
        <rect x={x - 1} y={top} width="2.4" height={h} fill={C.stem} rx="1" />
        {maturity >= 1 && (
          <path d={`M${x} ${top + 12} C${x} ${top + 6} ${x - 7} ${top + 4} ${x - 10} ${top + 6} C${x - 7} ${top + 10} ${x - 3} ${top + 13} ${x} ${top + 12} Z`} fill={C.leafDark} />
        )}
        {maturity >= 2 && (
          <g>
            {/* Calice de tulipe — 3 petales arrondis */}
            <ellipse cx={x - 3} cy={top - 3} rx="3.5" ry="5.5" fill={C.tulipRed}
              transform={`rotate(15 ${x - 3} ${top - 3})`} />
            <ellipse cx={x + 3} cy={top - 3} rx="3.5" ry="5.5" fill={C.tulipRedDeep}
              transform={`rotate(-15 ${x + 3} ${top - 3})`} />
            <ellipse cx={x} cy={top - 4} rx="2.8" ry="5" fill={C.tulipRed} />
          </g>
        )}
      </g>
    )
  }

  // --- Variant 4 : marguerite blanche ---
  if (variant === 4) {
    const top = baseY - h - 1
    return (
      <g>
        {sway}
        <rect x={x - 1} y={baseY - h} width="2.2" height={h} fill={C.stem} rx="1" />
        {maturity >= 1 && (
          <>
            <path d={`M${x} ${baseY - h + 9} C${x} ${baseY - h + 3} ${x + 7} ${baseY - h + 1} ${x + 10} ${baseY - h + 3} C${x + 7} ${baseY - h + 8} ${x + 3} ${baseY - h + 10} ${x} ${baseY - h + 9} Z`} fill={C.leafDark} />
            <path d={`M${x} ${baseY - h + 14} C${x} ${baseY - h + 8} ${x - 6} ${baseY - h + 6} ${x - 9} ${baseY - h + 8} C${x - 6} ${baseY - h + 12} ${x - 3} ${baseY - h + 15} ${x} ${baseY - h + 14} Z`} fill={C.leafLight} />
          </>
        )}
        {maturity >= 2 && (
          <g>
            <Petals cx={x} cy={top} r={3.8} petalR={2.5} fill={C.daisy} count={7} />
            <circle cx={x} cy={top} r="2.5" fill={C.daisyCore} />
          </g>
        )}
      </g>
    )
  }

  // --- Variant 5 : fleur corail a petales ronds ---
  {
    const top = baseY - h - 1
    return (
      <g>
        {sway}
        <rect x={x - 1} y={baseY - h} width="2.4" height={h} fill={C.stemDark} rx="1" />
        {maturity >= 1 && (
          <path d={`M${x} ${baseY - h + 8} C${x} ${baseY - h + 2} ${x - 8} ${baseY - h} ${x - 11} ${baseY - h + 2} C${x - 8} ${baseY - h + 7} ${x - 3} ${baseY - h + 9} ${x} ${baseY - h + 8} Z`} fill={C.leafLight} />
        )}
        {maturity >= 2 && (
          <g>
            <Petals cx={x} cy={top} r={3.2} petalR={2.6} fill={C.coral} count={6} />
            <circle cx={x} cy={top} r="2" fill={C.coralCore} />
          </g>
        )}
      </g>
    )
  }
}

export default function GrowingGarden({ days = 0 }) {
  const maturity = days >= 14 ? 2 : days >= 5 ? 1 : 0
  const plantCount = Math.min(days, 12)
  const positions = Array.from({ length: plantCount }, (_, i) => {
    const spread = 240 / Math.max(plantCount, 1)
    return 35 + i * spread + ((i % 2) * 6 - 3)
  })

  return (
    <svg viewBox="0 0 300 100" style={{ width: '100%' }} role="img" aria-label={`Jardin de ${days} jour${days > 1 ? 's' : ''} suivi${days > 1 ? 's' : ''}`}>
      <ellipse cx="150" cy="88" rx="142" ry="14" fill="#DCE8DD" />
      {positions.map((x, i) => (
        <Plant key={i} x={x} index={i} maturity={maturity} />
      ))}
      {days === 0 && (
        <text x="150" y="50" textAnchor="middle" fontSize="12" fill="#9DAFA1" fontFamily="Nunito, sans-serif">
          Ton jardin attend sa premiere pousse
        </text>
      )}
    </svg>
  )
}
