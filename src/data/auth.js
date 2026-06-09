// =============================================================
// Gestion des comptes et sessions — localStorage
// Chaque compte a ses propres donnees (episodes, profil)
// namespacees par accountId.
// =============================================================

const ACCOUNTS_KEY = 'pousse.accounts'
const SESSION_KEY = 'pousse.session'

// ---- Comptes ----

export function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

// ---- Session ----

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setSession(accountId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId }))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function currentAccountId() {
  const s = getSession()
  return s ? s.accountId : null
}

export function currentAccountName() {
  const id = currentAccountId()
  if (!id) return null
  const acc = loadAccounts().find((a) => a.id === id)
  return acc ? acc.name : null
}

// ---- Inscription / Connexion ----

export function register(name, password) {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'Choisis un nom' }
  if (!password) return { ok: false, error: 'Choisis un mot de passe' }

  const accounts = loadAccounts()
  if (accounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: 'Ce nom est deja pris' }
  }

  const account = {
    id: crypto.randomUUID(),
    name: trimmed,
    password,
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  saveAccounts(accounts)
  setSession(account.id)
  return { ok: true, account }
}

export function login(name, password) {
  const trimmed = name.trim()
  const accounts = loadAccounts()
  const match = accounts.find(
    (a) => a.name.toLowerCase() === trimmed.toLowerCase() && a.password === password
  )
  if (!match) return { ok: false, error: 'Nom ou mot de passe incorrect' }
  setSession(match.id)
  return { ok: true, account: match }
}

export function logout() {
  clearSession()
}

// ---- Migration des anciennes donnees ----

const OLD_EPISODES_KEY = 'pousse.episodes.v1'
const OLD_PROFILE_KEY = 'pousse.profile.v1'
const OLD_DEMO_KEY = 'pousse.demo.seeded'

/**
 * Si des donnees non-namespacees existent (avant le systeme de comptes),
 * les migre vers un compte "Mon compte" auto-cree.
 */
export function migrateIfNeeded() {
  const oldEpisodes = localStorage.getItem(OLD_EPISODES_KEY)
  const oldProfile = localStorage.getItem(OLD_PROFILE_KEY)
  if (!oldEpisodes && !oldProfile) return

  // Verifier qu'on n'a pas deja migre
  const accounts = loadAccounts()
  if (accounts.length > 0) return

  const account = {
    id: crypto.randomUUID(),
    name: 'Mon compte',
    password: 'pousse',
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  saveAccounts(accounts)
  setSession(account.id)

  // Copier les donnees vers le namespace du nouveau compte
  if (oldEpisodes) {
    localStorage.setItem(`pousse.${account.id}.episodes.v1`, oldEpisodes)
  }
  if (oldProfile) {
    localStorage.setItem(`pousse.${account.id}.profile.v1`, oldProfile)
  }

  // Nettoyer les anciennes cles
  localStorage.removeItem(OLD_EPISODES_KEY)
  localStorage.removeItem(OLD_PROFILE_KEY)
  localStorage.removeItem(OLD_DEMO_KEY)
}

// ---- Compte test Marie ----

const TEST_ID = 'test-marie'

function dayKeyForSeed(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Cree le compte test "Marie" avec 6 jours d'episodes
 * repartis sur les 7 derniers jours (jour 6/7 du cycle jardin).
 * Ne s'execute qu'une seule fois (si le compte n'existe pas deja).
 */
export function seedTestAccount() {
  const accounts = loadAccounts()
  if (accounts.some((a) => a.id === TEST_ID)) return

  const account = {
    id: TEST_ID,
    name: 'Marie',
    password: 'test',
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  saveAccounts(accounts)

  const now = new Date()
  const gardenStart = new Date(now)
  gardenStart.setDate(gardenStart.getDate() - 6)

  // 6 jours d'episodes sur 7 jours (skip jour 4 = il y a 3 jours)
  const dayOffsets = [6, 5, 4, 2, 1, 0]
  const templates = [
    { condition: 'migraine', zones: ['tete'], triggers: ['Stress'], treatment: 'Triptan', extra: ['Nausee'], intensity: 6, duration: '2-4h', hour: 8 },
    { condition: 'sii', zones: ['abdomen'], triggers: ['Aliment gras'], treatment: 'Antispasmodique', extra: ['Molle'], intensity: 4, duration: '<1h', hour: 12 },
    { condition: 'fibro', zones: ['torse', 'brasG'], triggers: ['Sommeil'], treatment: 'Antalgique', extra: ['Fatigue intense'], intensity: 7, duration: '½ jour', hour: 7 },
    { condition: 'migraine', zones: ['tete'], triggers: ['Ecran', 'Stress'], treatment: 'Aucun', extra: ['Photophobie'], intensity: 5, duration: '2-4h', hour: 14 },
    { condition: 'sii', zones: ['abdomen'], triggers: ['Lactose'], treatment: 'Aucun', extra: ['Liquide'], intensity: 3, duration: '<1h', hour: 16 },
    { condition: 'fibro', zones: ['jambeG', 'jambeD'], triggers: ['Effort', 'Froid'], treatment: 'Antalgique', extra: ['Raideur matinale'], intensity: 8, duration: '+1j', hour: 9 },
  ]

  const episodes = dayOffsets.map((offset, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - offset)
    date.setHours(templates[i].hour, Math.floor(Math.random() * 40 + 10), 0, 0)
    const t = templates[i]
    return {
      id: crypto.randomUUID(),
      createdAt: date.toISOString(),
      condition: t.condition,
      zones: t.zones,
      intensity: t.intensity,
      duration: t.duration,
      triggers: t.triggers,
      treatment: t.treatment,
      efficacy: t.treatment !== 'Aucun' ? ['Un peu', 'Bien', 'Pas encore'][i % 3] : null,
      extra: t.extra,
    }
  })

  const lastPeriod = new Date(now)
  lastPeriod.setDate(lastPeriod.getDate() - 12)

  const profile = {
    gender: 'f',
    cycleOn: true,
    cycleLength: 28,
    lastPeriod: dayKeyForSeed(lastPeriod),
    planetsOn: true,
    gardenStartDate: dayKeyForSeed(gardenStart),
    completedGardens: 1,
  }

  try {
    localStorage.setItem(`pousse.${TEST_ID}.episodes.v1`, JSON.stringify(episodes))
    localStorage.setItem(`pousse.${TEST_ID}.profile.v1`, JSON.stringify(profile))
  } catch (e) {
    console.error('Echec du seed compte test', e)
  }
}
