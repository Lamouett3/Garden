import { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  loadEpisodes, saveEpisode as persistEpisode, updateEpisode as persistUpdate,
  deleteEpisode as persistDelete, loadProfile, saveProfile as persistProfile,
} from './storage'

const StoreContext = createContext(null)

export function StoreProvider({ children, onStorageError }) {
  const [episodes, setEpisodes] = useState(() => loadEpisodes())
  const [profile, setProfile] = useState(() => loadProfile())
  const errorCb = useRef(onStorageError)
  errorCb.current = onStorageError

  const notifyError = useCallback(() => {
    if (errorCb.current) errorCb.current()
  }, [])

  const addEpisode = useCallback((episode) => {
    try {
      const saved = persistEpisode(episode)
      setEpisodes((prev) => [...prev, saved])
      return saved
    } catch {
      notifyError()
      return null
    }
  }, [notifyError])

  const editEpisode = useCallback((id, patch) => {
    try {
      persistUpdate(id, patch)
      setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    } catch {
      notifyError()
    }
  }, [notifyError])

  const removeEpisode = useCallback((id) => {
    persistDelete(id)
    setEpisodes((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      try {
        persistProfile(next)
      } catch {
        notifyError()
      }
      return next
    })
  }, [notifyError])

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
