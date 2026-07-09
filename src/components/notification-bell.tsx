'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Check, X, Trash2, UserPlus, UserCheck, Trophy, Info, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: string | null
  read: boolean
  createdAt: string
}

const iconMap: { [key: string]: { icon: typeof Bell; color: string } } = {
  friend_request: { icon: UserPlus, color: 'text-blue-500' },
  friend_accepted: { icon: UserCheck, color: 'text-emerald-500' },
  achievement: { icon: Trophy, color: 'text-amber-500' },
  daily_reminder: { icon: Bell, color: 'text-orange-500' },
  info: { icon: Info, color: 'text-slate-500' },
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'только что'
    if (minutes < 60) return `${minutes} мин назад`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ч назад`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} дн назад`
    return new Date(date).toLocaleDateString('ru-RU')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setOpen((s) => !s)
          if (!open) loadNotifications()
        }}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border bg-card shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Уведомления</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Прочитать все
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Нет уведомлений
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon: Icon, color } = iconMap[n.type] || iconMap.info
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.read) handleMarkRead(n.id)
                        // Navigate based on type
                        if (n.type === 'friend_request' || n.type === 'friend_accepted') {
                          router.push('/community/friends')
                          setOpen(false)
                        }
                      }}
                      className={cn(
                        'p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <div className={cn('shrink-0 mt-0.5', color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(n.createdAt)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          aria-label="Удалить"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
