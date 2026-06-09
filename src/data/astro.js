// =============================================================
// Calculs astronomiques simplifies — positions planetaires & lune
// Elements orbitaux moyens J2000.0 (1er janvier 2000, 12h TT).
// Precision : quelques degres — suffisant pour un schema.
// =============================================================

const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0)

function daysSinceJ2000(date) {
  return (date.getTime() - J2000) / 86400000
}

// Periode orbitale siderale (jours) et longitude moyenne a J2000.0 (degres)
const PLANETS = [
  { id: 'mercure',  label: 'Mercure',  T: 87.969,   L0: 252.25 },
  { id: 'venus',    label: 'Venus',    T: 224.701,  L0: 181.98 },
  { id: 'terre',    label: 'Terre',    T: 365.256,  L0: 100.46 },
  { id: 'mars',     label: 'Mars',     T: 686.980,  L0: 355.45 },
  { id: 'jupiter',  label: 'Jupiter',  T: 4332.59,  L0: 34.40  },
  { id: 'saturne',  label: 'Saturne',  T: 10759.22, L0: 49.94  },
]

/**
 * Positions ecliptiques simplifiees de 6 planetes.
 * Renvoie un tableau de { id, label, angle } ou angle est en degres [0, 360).
 */
export function getPlanetPositions(date = new Date()) {
  const d = daysSinceJ2000(date)
  return PLANETS.map(({ id, label, T, L0 }) => {
    const angle = ((L0 + (d / T) * 360) % 360 + 360) % 360
    return { id, label, angle }
  })
}

// Periode synodique moyenne de la Lune (jours)
const SYNODIC_MONTH = 29.53059

// Phase connue : nouvelle lune du 6 janvier 2000 (epoch de reference)
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0)

/**
 * Phase lunaire en fraction 0..1.
 * 0 = nouvelle lune, ~0.5 = pleine lune, ~1 = retour nouvelle lune.
 */
export function getMoonPhase(date = new Date()) {
  const daysSinceRef = (date.getTime() - KNOWN_NEW_MOON) / 86400000
  const phase = ((daysSinceRef / SYNODIC_MONTH) % 1 + 1) % 1
  return phase
}

const PHASE_NAMES = [
  { max: 0.0375, label: 'Nouvelle lune',        icon: 'new'            },
  { max: 0.2125, label: 'Premier croissant',     icon: 'waxing-crescent' },
  { max: 0.2875, label: 'Premier quartier',      icon: 'first-quarter'  },
  { max: 0.4625, label: 'Gibbeuse croissante',   icon: 'waxing-gibbous' },
  { max: 0.5375, label: 'Pleine lune',           icon: 'full'           },
  { max: 0.7125, label: 'Gibbeuse decroissante', icon: 'waning-gibbous' },
  { max: 0.7875, label: 'Dernier quartier',      icon: 'last-quarter'   },
  { max: 0.9625, label: 'Dernier croissant',     icon: 'waning-crescent'},
  { max: 1.0,    label: 'Nouvelle lune',         icon: 'new'            },
]

/**
 * Nom de la phase lunaire en francais + type d'icone.
 */
export function getMoonPhaseName(date = new Date()) {
  const p = getMoonPhase(date)
  for (const entry of PHASE_NAMES) {
    if (p <= entry.max) return { label: entry.label, icon: entry.icon }
  }
  return PHASE_NAMES[0]
}
