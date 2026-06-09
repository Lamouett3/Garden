import { createContext, useContext, useState, useCallback } from 'react'
import {
  loadEpisodes, saveEpisode as persistEpisode, updateEpisode as persistUpdate,
  deleteEpisode as persistDelete, loadProfile, saveProfile as persistProfile,
} from './storage'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [episodes, setEpisodes] = useState(() => loadEpisodes())
  const [profile, setProfile] = useState(() => loadProfile())

  const addEpisode = useCallback((episode) => {
    const saved = persistEpisode(episode)
    setEpisodes((prev) => [...prev, saved])
    return saved
  }, [])

  const editEpisode = useCallback((id, patch) => {
    persistUpdate(id, patch)
    setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])

  const removeEpisode = useCallback((id) => {
    persistDelete(id)
    setEpisodes((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      persistProfile(next)
      return next
    })
  }, [])

  return (
    <StoreContext.Provider value={{ episodes, addEpisode, editEpisode, removeEpisode, profile, updateProfile }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore doit être utilisé dans StoreProvider')
  return ctx
}
