// =============================================================
// Météo — Open-Meteo API (gratuit, sans clé API)
// Utilise la géolocalisation du navigateur pour récupérer la
// météo actuelle. Cache le résultat en localStorage 30 min.
// =============================================================

const CACHE_KEY = 'pousse.weather.cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * WMO Weather interpretation codes → catégorie simplifiée
 * https://open-meteo.com/en/docs
 */
function classifyWeather(code) {
  if (code === 0) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code <= 48) return 'fog'
  if (code <= 57) return 'drizzle'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'rain'
  if (code <= 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.ts > CACHE_TTL) return null
    return data.weather
  } catch {
    return null
  }
}

function setCache(weather) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), weather }))
  } catch { /* ignore */ }
}

/**
 * Récupère la météo actuelle via géolocalisation + Open-Meteo.
 * Renvoie une promesse : { type, isDay, temp } ou null en cas d'erreur.
 * type : 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'
 */
export async function fetchWeather() {
  const cached = getCache()
  if (cached) return cached

  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('no geolocation'))
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: CACHE_TTL,
      })
    })

    const { latitude, longitude } = pos.coords
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const cw = data.current_weather

    const weather = {
      type: classifyWeather(cw.weathercode),
      isDay: cw.is_day === 1,
      temp: cw.temperature,
    }
    setCache(weather)
    return weather
  } catch {
    return null
  }
}
