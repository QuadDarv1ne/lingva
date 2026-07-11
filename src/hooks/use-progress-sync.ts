'use client'

import { useEffect, useRef } from 'react'
import { useProgressStore } from '@/lib/store'

// Hook to sync user progress with server when logged in
// Loads progress on mount, saves on changes (debounced)
export function useProgressSync(isAuthenticated: boolean) {
  const { progress, favorites, achievements, streak, activityLog, xp, dailyChallenges, personalDictionary, ownedItems, settings } = useProgressStore()
  const initialLoadRef = useRef(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load progress from server on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated || initialLoadRef.current) return
    initialLoadRef.current = true

    fetch('/api/progress')
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) {
          // Replace local progress with server progress
          const currentState = useProgressStore.getState()
          // Use persist's set to replace state
          useProgressStore.setState({
            ...currentState,
            ...data.progress,
          }, false)
        }
      })
      .catch(() => {
        // ignore - use local progress
      })
  }, [isAuthenticated])

  // Save progress to server on changes (debounced 3s)
  useEffect(() => {
    if (!isAuthenticated || !initialLoadRef.current) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      const state = useProgressStore.getState()
      const payload = {
        progress: state.progress,
        favorites: state.favorites,
        achievements: state.achievements,
        streak: state.streak,
        activityLog: state.activityLog,
        xp: state.xp,
        dailyChallenges: state.dailyChallenges,
        personalDictionary: state.personalDictionary,
        ownedItems: state.ownedItems,
        settings: state.settings,
      }

      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: payload }),
      }).catch(() => {
        // ignore - progress saved locally
      })
    }, 3000)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [isAuthenticated, progress, favorites, achievements, streak, activityLog, xp, dailyChallenges, personalDictionary, ownedItems, settings])
}
