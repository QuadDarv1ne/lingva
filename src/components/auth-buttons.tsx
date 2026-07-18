'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  LogOut,
  ChevronDown,
  Mail,
  Shield,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified?: boolean
}

export function AuthButtons() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null)
        setLoading(false)
      })
      .catch((err) => { console.error('Failed to fetch auth:', err); setLoading(false) })
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setMenuOpen(false)
      toast({ title: 'Вы вышли из аккаунта' })
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">Войти</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/register">Регистрация</Link>
        </Button>
      </div>
    )
  }

  const displayName = user.name || user.email.split('@')[0] || '?'
  const initial = (displayName[0] || '?').toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((s) => !s)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Профиль"
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <Avatar className="w-8 h-8 border-2 border-primary/30 relative">
          <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white font-semibold text-sm">
            {initial}
          </AvatarFallback>
          {!user.emailVerified && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-background"
              title="Email не подтверждён"
            />
          )}
        </Avatar>
        <ChevronDown className={cn(
          'w-3 h-3 text-muted-foreground transition-transform hidden sm:block',
          menuOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 rounded-lg border bg-card shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white font-semibold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>
              {user.emailVerified === false && (
                <Link
                  href="/auth/profile"
                  onClick={() => setMenuOpen(false)}
                  className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  Подтвердите email
                </Link>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/auth/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Профиль и настройки
              </Link>
              <Link
                href="/community/friends"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
                Сообщество
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
