// =============================================================
// Agrégations statistiques calculées à partir des épisodes réels.
// Utilisé par le dashboard (vue perso) et le rapport (vue médecin).
// =============================================================

import { dayKey } from './storage'

function fmt1(n) {
  return (Math.round(n * 10) / 10).toString().replace('.', ',')
}

// Exclut les episodes "bien-etre" (pas de symptome, juste maintien de serie)
export function withoutBienetre(episodes) {
  return episodes.filter((e) => e.condition !== 'bienetre')
}

// Filtre les épisodes d'une pathologie (ou tous si null)
export function filterByCondition(episodes, condition) {
  return condition ? episodes.filter((e) => e.condition === condition) : episodes
}

// Stats globales sur un ensemble d'épisodes
export function computeStats(episodes) {
  const n = episodes.length
  if (n === 0) {
    return { count: 0, avgIntensity: '—', avgDurationLabel: '—', topTriggers: [], treatments: [] }
  }
  const avgIntensity = fmt1(episodes.reduce((s, e) => s + (e.intensity || 0), 0) / n)

  // Déclencheurs les plus fréquents
  const trigCount = {}
  episodes.forEach((e) => (e.triggers || []).forEach((t) => { trigCount[t] = (trigCount[t] || 0) + 1 }))
  const topTriggers = Object.entries(trigCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([label, count]) => ({ label, count }))

  // Traitements et efficacité
  const tre = {}
  episodes.forEach((e) => {
    if (!e.treatment || e.treatment === 'Aucun') return
    if (!tre[e.treatment]) tre[e.treatment] = { taken: 0, relieved: 0 }
    tre[e.treatment].taken++
    if (e.efficacy === 'Bien' || e.efficacy === 'Un peu') tre[e.treatment].relieved++
  })
  const treatments = Object.entries(tre).map(([name, v]) => ({ name, ...v }))

  return { count: n, avgIntensity, topTriggers, treatments }
}

// Série temporelle pour le dashboard (semaine / mois / année)
// Renvoie { bars: [{v, c}], labels: [] } où v = intensité repère, c = palier
export function buildSeries(episodes, view) {
  const now = new Date()
  const byDay = {}
  episodes.forEach((e) => {
    const k = dayKey(e.createdAt)
    if (!byDay[k]) byDay[k] = []
    byDay[k].push(e)
  })

  const level = (maxIntensity) => (maxIntensity === 0 ? 'empty' : maxIntensity <= 4 ? 'calm' : maxIntensity <= 7 ? 'light' : 'strong')

  if (view === 's') {
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    const monday = new Date(now)
    const dow = (now.getDay() + 6) % 7
    monday.setDate(now.getDate() - dow)
    const bars = labels.map((_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      const eps = byDay[dayKey(d)] || []
      const maxI = eps.reduce((m, e) => Math.max(m, e.intensity || 0), 0)
      return { v: eps.length ? maxI : 0, c: level(eps.length ? maxI : 0) }
    })
    return { bars, labels }
  }

  if (view === 'm') {
    const labels = ['S1', 'S2', 'S3', 'S4']
    const bars = labels.map((_, w) => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1 + w * 7)
      let maxI = 0, count = 0
      for (let d = 0; d < 7; d++) {
        const day = new Date(start); day.setDate(start.getDate() + d)
        const eps = byDay[dayKey(day)] || []
        eps.forEach((e) => { maxI = Math.max(maxI, e.intensity || 0); count++ })
      }
      return { v: count ? maxI : 0, c: level(count ? maxI : 0) }
    })
    return { bars, labels }
  }

  // année
  const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const bars = labels.map((_, m) => {
    let maxI = 0, count = 0
    Object.entries(byDay).forEach(([k, eps]) => {
      const d = new Date(k)
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === m) {
        eps.forEach((e) => { maxI = Math.max(maxI, e.intensity || 0); count++ })
      }
    })
    return { v: count ? maxI : 0, c: level(count ? maxI : 0) }
  })
  return { bars, labels }
}
