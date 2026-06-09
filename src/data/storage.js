// =============================================================
// Persistance des données — localStorage
// MVP : tout reste sur l'appareil (pas de serveur).
// Voir CLAUDE.md §9 pour la stratégie réglementaire.
// =============================================================

const EPISODES_KEY = 'pousse.episodes.v1'
const PROFILE_KEY = 'pousse.profile.v1'

// ---- Épisodes ----

export function loadEpisodes() {
  try {
    const raw = localStorage.getItem(EPISODES_KEY)
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
    localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes))
  } catch (e) {
    console.error('Échec de sauvegarde', e)
  }
  return withId
}

export function updateEpisode(id, patch) {
  const episodes = loadEpisodes().map((e) => (e.id === id ? { ...e, ...patch } : e))
  try {
    localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes))
  } catch (e) {
    console.error('Échec de mise à jour', e)
  }
}

export function deleteEpisode(id) {
  const episodes = loadEpisodes().filter((e) => e.id !== id)
  localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes))
}

// ---- Profil ----

const DEFAULT_PROFILE = {
  gender: 'f',
  cycleOn: true,
  cycleLength: 28,
  lastPeriod: '',
  planetsOn: false, // désactivé par défaut — cf. CLAUDE.md §3
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.error('Échec de sauvegarde du profil', e)
  }
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
