// =============================================================
// GrowingGarden — le jardin qui pousse
// Chaque jour signalé fait apparaître une plante. Plus il y a de
// jours suivis, plus le jardin est fourni (3 paliers de maturité).
// Animation douce de balancement au vent.
// Props : days (nombre de jours distincts signalés)
// =============================================================

const PLANT_COLORS = {
  stem: '#86A98B',
  leafDark: '#7FB089',
  leafLight: '#9FC4A4',
  flowerPink: '#F3C8D2',
  flowerPinkCore: '#E89BAC',
  flowerYellow: '#F7DCA0',
  flowerYellowCore: '#E9B85E',
}

// Parametres de vent par plante — durees et delais differents pour un effet naturel
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

function Plant({ x, index, maturity }) {
  const variants = index % 3
  const h = maturity === 0 ? 14 : maturity === 1 ? 22 : 30
  const c = PLANT_COLORS
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

  if (variants === 0) {
    return (
      <g>
        {sway}
        <rect x={x - 1} y={baseY - h} width="2.4" height={h} fill={c.stem} rx="1" />
        {maturity >= 1 && (
          <path d={`M${x} ${baseY - h + 8} C${x} ${baseY - h + 2} ${x - 8} ${baseY - h} ${x - 11} ${baseY - h + 2} C${x - 8} ${baseY - h + 7} ${x - 3} ${baseY - h + 9} ${x} ${baseY - h + 8} Z`} fill={c.leafDark} />
        )}
        {maturity >= 2 && (
          <>
            <circle cx={x} cy={baseY - h - 1} r="6" fill={c.flowerPink} />
            <circle cx={x} cy={baseY - h - 1} r="2.4" fill={c.flowerPinkCore} />
          </>
        )}
      </g>
    )
  }
  if (variants === 1) {
    return (
      <g>
        {sway}
        <path d={`M${x} ${baseY} C${x - 2} ${baseY - h} ${x - 5} ${baseY - h - 2} ${x - 7} ${baseY - h - 4} C${x - 4} ${baseY - h + 6} ${x} ${baseY - h + 10} ${x} ${baseY} Z`} fill={c.leafDark} />
        <path d={`M${x} ${baseY} C${x + 2} ${baseY - h + 2} ${x + 5} ${baseY - h} ${x + 7} ${baseY - h - 2} C${x + 4} ${baseY - h + 8} ${x} ${baseY - h + 10} ${x} ${baseY} Z`} fill={c.leafLight} />
      </g>
    )
  }
  return (
    <g>
      {sway}
      <rect x={x - 1} y={baseY - h} width="2.4" height={h} fill={c.stem} rx="1" />
      {maturity >= 1 && (
        <path d={`M${x} ${baseY - h + 10} C${x} ${baseY - h + 4} ${x + 8} ${baseY - h + 2} ${x + 11} ${baseY - h + 4} C${x + 8} ${baseY - h + 9} ${x + 3} ${baseY - h + 11} ${x} ${baseY - h + 10} Z`} fill={c.leafLight} />
      )}
      {maturity >= 2 && (
        <>
          <circle cx={x} cy={baseY - h - 1} r="5" fill={c.flowerYellow} />
          <circle cx={x} cy={baseY - h - 1} r="2" fill={c.flowerYellowCore} />
        </>
      )}
    </g>
  )
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
