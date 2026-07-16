'use client'

import { useEffect, useRef } from 'react'
import { useProgressStore } from '@/lib/store'

// Hook to sync user progress with server when logged in
// Loads progress on mount, saves on changes (debounced)
export function useProgressSync(isAuthenticated: boolean) {
  const initialLoadRef = useRef(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<string>('')

  // Load progress from server on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      initialLoadRef.current = false
      return
    }
    if (initialLoadRef.current) return

    fetch('/api/progress')
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) {
          const currentState = useProgressStore.getState()
          useProgressStore.setState({
            ...currentState,
            ...data.progress,
          }, false)
        }
      })
      .catch((err) => { console.error('Failed to load progress from server:', err) })
      .finally(() => {
        initialLoadRef.current = true // mark load complete AFTER fetch resolves
      })
  }, [isAuthenticated])

  // Subscribe to store changes and save (debounced 5s)
  useEffect(() => {
    if (!isAuthenticated || !initialLoadRef.current) return

    const unsubscribe = useProgressStore.subscribe(() => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(() => {
        const currentState = useProgressStore.getState()
        const payload = {
          progress: currentState.progress,
          favorites: currentState.favorites,
          achievements: currentState.achievements,
          streak: currentState.streak,
          activityLog: currentState.activityLog,
          xp: currentState.xp,
          dailyChallenges: currentState.dailyChallenges,
          personalDictionary: currentState.personalDictionary,
          ownedItems: currentState.ownedItems,
          settings: currentState.settings,
        }

        const serialized = JSON.stringify(payload)
        // Skip save if nothing changed since last save
        if (serialized === lastSaveRef.current) return
        lastSaveRef.current = serialized

        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: payload }),
        }).catch((err) => { console.error('Failed to save progress to server:', err) })
      }, 5000)
    })

    return () => {
      unsubscribe()
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [isAuthenticated])
}
