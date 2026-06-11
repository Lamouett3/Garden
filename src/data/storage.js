// =============================================================
// Persistance des données — localStorage
// MVP : tout reste sur l'appareil (pas de serveur).
// Voir CLAUDE.md §9 pour la stratégie réglementaire.
// Cles namespacees par compte (voir auth.js).
// =============================================================

import { currentAccountId } from './auth'

function ns() { return `pousse.${currentAccountId()}` }
function episodesKey() { return `${ns()}.episodes.v1` }
function profileKey() { return `${ns()}.profile.v1` }

// ---- Épisodes ----

export function loadEpisodes() {
  try {
    const raw = localStorage.getItem(episodesKey())
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEpisode(episode) {
  const episodes = loadEpisodes()
  const withId = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...episode }
  episodes.push(withId)
  try {
    localStorage.setItem(episodesKey(), JSON.stringify(episodes))
  } catch (e) {
    console.error('Échec de sauvegarde', e)
  }
  return withId
}

export function updateEpisode(id, patch) {
  const episodes = loadEpisodes().map((e) => (e.id === id ? { ...e, ...patch } : e))
  try {
    localStorage.setItem(episodesKey(), JSON.stringify(episodes))
  } catch (e) {
    console.error('Échec de mise à jour', e)
  }
}

export function deleteEpisode(id) {
  const episodes = loadEpisodes().filter((e) => e.id !== id)
  localStorage.setItem(episodesKey(), JSON.stringify(episodes))
}

// ---- Profil ----

const DEFAULT_PROFILE = {
  gender: 'f',
  cycleOn: true,
  cycleLength: 28,
  lastPeriod: '',
  cycleMode: 'natural', // 'natural' | 'pill'
  pillActiveDays: 21,
  pillBreakDays: 7,
  pillPackStart: '',
  moonOn: false,    // repères lunaires — désactivé par défaut (cf. CLAUDE.md §3)
  planetsOn: false,  // repères planétaires — désactivé par défaut (cf. CLAUDE.md §3)
  gardenStartDate: null,
  completedGardens: 0,
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(profileKey())
    const profile = raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE }
    // Auto-init gardenStartDate au premier chargement
    if (!profile.gardenStartDate) {
      profile.gardenStartDate = dayKey(new Date())
      saveProfile(profile)
    }
    return profile
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(profileKey(), JSON.stringify(profile))
  } catch (e) {
    console.error('Échec de sauvegarde du profil', e)
  }
}

// ---- Phase du cycle menstruel ----

const CYCLE_PHASES = [
  { max: 5,  label: 'Regles',       icon: 'ti-droplet',  color: 'pink' },
  { max: 13, label: 'Folliculaire', icon: 'ti-arrow-up', color: 'green' },
  { max: 16, label: 'Ovulation',    icon: 'ti-sun',      color: 'amber' },
  { max: 99, label: 'Luteale',      icon: 'ti-leaf',     color: 'sand' },
]

/**
 * Calcule la phase pilule.
 * Renvoie { label, icon, color, day, total, phaseDay, phaseTotal } ou null.
 */
export function getPillPhase(profile) {
  if (!profile.cycleOn || !profile.pillPackStart) return null
  const start = new Date(profile.pillPackStart)
  if (isNaN(start.getTime())) return null
  const today = new Date()
  const diffMs = today.getTime() - start.getTime()
  if (diffMs < 0) return null
  const active = profile.pillActiveDays || 21
  const pause = profile.pillBreakDays || 7
  const totalLen = active + pause
  const dayInCycle = (Math.floor(diffMs / 86400000) % totalLen) + 1
  if (dayInCycle <= active) {
    return { label: 'Pilule active', icon: 'ti-pill', color: 'green', day: dayInCycle, total: totalLen, phaseDay: dayInCycle, phaseTotal: active }
  }
  const pauseDay = dayInCycle - active
  return { label: 'Pause', icon: 'ti-droplet', color: 'pink', day: dayInCycle, total: totalLen, phaseDay: pauseDay, phaseTotal: pause }
}

/**
 * Calcule la phase actuelle du cycle menstruel.
 * Renvoie { label, icon, color, day } ou null si les donnees sont absentes.
 * Si cycleMode === 'pill', delegue a getPillPhase.
 */
export function getCyclePhase(profile) {
  if (profile.cycleMode === 'pill') return getPillPhase(profile)
  if (!profile.cycleOn || !profile.lastPeriod) return null
  const start = new Date(profile.lastPeriod)
  if (isNaN(start.getTime())) return null
  const today = new Date()
  const diffMs = today.getTime() - start.getTime()
  if (diffMs < 0) return null
  const cycleLen = profile.cycleLength || 28
  const dayInCycle = (Math.floor(diffMs / 86400000) % cycleLen) + 1
  // Adapter les seuils au cycle reel (phase luteale = 14j fixes, le reste s'ajuste)
  const follEnd = Math.max(6, cycleLen - 16)
  const ovuEnd = follEnd + 3
  const thresholds = [
    { max: 5,      ...CYCLE_PHASES[0] },
    { max: follEnd, ...CYCLE_PHASES[1] },
    { max: ovuEnd,  ...CYCLE_PHASES[2] },
    { max: cycleLen, ...CYCLE_PHASES[3] },
  ]
  for (const phase of thresholds) {
    if (dayInCycle <= phase.max) return { label: phase.label, icon: phase.icon, color: phase.color, day: dayInCycle, total: cycleLen }
  }
  return { ...CYCLE_PHASES[3], day: dayInCycle, total: cycleLen }
}

// ---- Helpers de dates ----

export function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Renvoie l'ensemble des jours (clé AAAA-MM-JJ) où au moins un épisode a été noté
export function loggedDays(episodes) {
  return new Set(episodes.map((e) => dayKey(e.createdAt)))
}

/**
 * Compte les jours distincts avec episode depuis gardenStartDate.
 * Renvoie un Set de day keys.
 */
export function gardenLoggedDays(episodes, gardenStartDate) {
  if (!gardenStartDate) return new Set()
  return new Set(
    episodes
      .map((e) => dayKey(e.createdAt))
      .filter((dk) => dk >= gardenStartDate)
  )
}

// Calcule la série en cours (jours consécutifs avec au moins un signalement,
// en partant d'aujourd'hui ou d'hier pour ne pas casser la série en cours de journée)
export function currentStreak(episodes) {
  const days = loggedDays(episodes)
  if (days.size === 0) return 0
  let streak = 0
  const cursor = new Date()
  // tolérance : si rien aujourd'hui, on regarde à partir d'hier
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
