'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified?: boolean
  twoFactorEnabled?: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })
  const router = useRouter()

  // Check current auth status on mount
  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        setState({ user: data.user || null, loading: false, error: null })
      })
      .catch((err) => {
        if (!mounted) return
        console.error('Failed to fetch auth status:', err)
        setState({ user: null, loading: false, error: null })
      })
    return () => {
      mounted = false
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string, rememberMe: boolean = true) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации')
      setState({ user: data.user, loading: false, error: null })
      return data
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setState((s) => ({ ...s, loading: false, error: msg }))
      throw error
    }
  }, [])

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка входа')
      setState({ user: data.user, loading: false, error: null })
      return data
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setState((s) => ({ ...s, loading: false, error: msg }))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    }
    setState({ user: null, loading: false, error: null })
    router.push('/')
  }, [router])

  const updateProfile = useCallback(async (data: { name?: string; email?: string }) => {
    const res = await fetch('/api/auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Ошибка обновления')
    setState((s) => ({ ...s, user: result.user }))
    return result.user
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch('/api/auth/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Ошибка смены пароля')
    return result
  }, [])

  return {
    ...state,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
  }
}
