// =============================================================
// GrowingGarden — le jardin qui pousse
// Chaque jour signalé fait apparaître une plante. Plus il y a de
// jours suivis, plus le jardin est fourni (3 paliers de maturité).
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

// Génère une plante déterministe à partir d'un index (toujours la même forme)
function Plant({ x, index, maturity }) {
  const variants = index % 3
  const h = maturity === 0 ? 14 : maturity === 1 ? 22 : 30
  const c = PLANT_COLORS
  const baseY = 86

  if (variants === 0) {
    // pousse à fleur rose
    return (
      <g>
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
    // touffe d'herbe / feuilles
    return (
      <g>
        <path d={`M${x} ${baseY} C${x - 2} ${baseY - h} ${x - 5} ${baseY - h - 2} ${x - 7} ${baseY - h - 4} C${x - 4} ${baseY - h + 6} ${x} ${baseY - h + 10} ${x} ${baseY} Z`} fill={c.leafDark} />
        <path d={`M${x} ${baseY} C${x + 2} ${baseY - h + 2} ${x + 5} ${baseY - h} ${x + 7} ${baseY - h - 2} C${x + 4} ${baseY - h + 8} ${x} ${baseY - h + 10} ${x} ${baseY} Z`} fill={c.leafLight} />
      </g>
    )
  }
  // pousse à fleur jaune
  return (
    <g>
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
  // niveau de maturité global selon l'assiduité
  const maturity = days >= 14 ? 2 : days >= 5 ? 1 : 0
  // nombre de plantes affichées (cap visuel à 12 pour rester lisible)
  const plantCount = Math.min(days, 12)
  const positions = Array.from({ length: plantCount }, (_, i) => {
    // réparties le long du sol, légèrement irrégulières
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
          Ton jardin attend sa première pousse
        </text>
      )}
    </svg>
  )
}
