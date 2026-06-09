import { colors } from '../theme/tokens'

// =============================================================
// BodySilhouette — silhouette organique (formes arrondies, DA jardin)
// Props :
//   suggested : string[]  zones suggérées (pointillé ambre)
//   active    : string[]  zones sélectionnées par l'utilisateur (rose)
//   onToggle  : (zoneId) => void
// =============================================================

const ZONES = {
  tete: 'M60 6 C71 6 79 15 79 26 C79 37 71 46 60 46 C49 46 41 37 41 26 C41 15 49 6 60 6 Z',
  torse:
    'M48 50 C48 50 72 50 72 50 C78 50 80 56 79 64 L77 92 C76 99 70 102 60 102 C50 102 44 99 43 92 L41 64 C40 56 42 50 48 50 Z',
  abdomen:
    'M45 104 C45 104 75 104 75 104 C78 110 77 122 74 134 C72 141 66 144 60 144 C54 144 48 141 46 134 C43 122 42 110 45 104 Z',
  brasG:
    'M38 56 C32 58 28 66 27 82 C26 96 27 108 30 116 C33 121 39 120 40 114 C41 100 41 74 42 62 C42 56 42 55 38 56 Z',
  brasD:
    'M82 56 C88 58 92 66 93 82 C94 96 93 108 90 116 C87 121 81 120 80 114 C79 100 79 74 78 62 C78 56 78 55 82 56 Z',
  jambeG:
    'M46 148 C44 162 44 184 46 198 C47 204 55 204 56 198 C58 182 58 162 57 150 C56 145 47 144 46 148 Z',
  jambeD:
    'M74 148 C76 162 76 184 74 198 C73 204 65 204 64 198 C62 182 62 162 63 150 C64 145 73 144 74 148 Z',
}

export default function BodySilhouette({ suggested = [], active = [], onToggle }) {
  const fillFor = (id) => {
    if (active.includes(id)) return colors.pink.bg
    if (suggested.includes(id)) return colors.amber.bg
    return colors.green.soft
  }
  const strokeFor = (id) => {
    if (active.includes(id)) return colors.pink.border
    if (suggested.includes(id)) return colors.amber.border
    return '#C4D4C7'
  }

  return (
    <svg
      viewBox="0 0 120 210"
      style={{ height: 158 }}
      role="img"
      aria-label="Silhouette du corps, tapez une zone pour la sélectionner"
    >
      {Object.entries(ZONES).map(([id, d]) => (
        <path
          key={id}
          d={d}
          onClick={() => onToggle?.(id)}
          style={{
            fill: fillFor(id),
            stroke: strokeFor(id),
            strokeWidth: 1.5,
            strokeDasharray: suggested.includes(id) && !active.includes(id) ? '3 2' : 'none',
            cursor: 'pointer',
            transition: 'fill .15s',
          }}
        />
      ))}
    </svg>
  )
}
