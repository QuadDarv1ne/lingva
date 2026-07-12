'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Users, UserPlus, Search, Check, X, Flame, Star, Zap, Loader2,
  UserCheck, UserX, Mail, Clock, Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Friend {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  friendshipId: string
  stats: {
    xp: number
    level: number
    streak: number
    achievementsCount: number
    languagesCount: number
  }
}

interface PendingRequest {
  friendshipId: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    avatar: string | null
  }
}

interface SearchResult {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  xp: number
  level: number
  friendship: { status: string; direction: 'sent' | 'received' } | null
}

export default function FriendsPage() {
  const { toast } = useToast()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([])
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/friends/list')
      const data = await res.json()
      setFriends(data.friends || [])
      setPendingReceived(data.pendingReceived || [])
      setPendingSent(data.pendingSent || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 0)
    return () => clearTimeout(timer)
  }, [loadData])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }
      setSearching(true)
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.users || [])
      } catch {
        // ignore
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleAddFriend = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      toast({
        title: data.autoAccepted ? 'Друг добавлен! 🎉' : 'Заявка отправлена 📨',
        description: data.autoAccepted ? 'Пользователь принял вашу заявку' : 'Ожидает подтверждения',
      })
      loadData()
      // Refresh search results
      if (searchQuery) {
        setSearchQuery(searchQuery + ' ') // trigger re-search
        setSearchQuery(searchQuery)
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAccept = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      })
      if (!res.ok) throw new Error('Ошибка')
      toast({ title: 'Друг добавлен! 🎉' })
      loadData()
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const res = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      })
      if (!res.ok) throw new Error('Ошибка')
      toast({ title: 'Заявка отклонена' })
      loadData()
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (friendshipId: string, name: string | null) => {
    if (!confirm(`Удалить ${name || 'пользователя'} из друзей?`)) return
    setActionLoading(friendshipId)
    try {
      const res = await fetch(`/api/friends/remove?id=${friendshipId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Ошибка')
      toast({ title: 'Удалён из друзей' })
      loadData()
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-background to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Друзья</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Социальная сеть
              </div>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">← На главную</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователей по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Результаты поиска
                </div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        {(user.name || user.email || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name || 'Без имени'}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                        {user.email && (
                          <span className="flex items-center gap-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-amber-500" />
                          Ур.{user.level}
                        </span>
                      </div>
                    </div>
                    {/* Action button based on friendship status */}
                    {!user.friendship && (
                      <Button
                        size="sm"
                        onClick={() => handleAddFriend(user.id)}
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3 mr-1" />
                        )}
                        Добавить
                      </Button>
                    )}
                    {user.friendship?.status === 'pending' && user.friendship.direction === 'sent' && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Отправлено
                      </Badge>
                    )}
                    {user.friendship?.status === 'pending' && user.friendship.direction === 'received' && (
                      <Badge variant="secondary" className="text-xs text-amber-700 bg-amber-100">
                        Хочет добавить вас
                      </Badge>
                    )}
                    {user.friendship?.status === 'accepted' && (
                      <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-100">
                        <UserCheck className="w-3 h-3 mr-1" />
                        В друзьях
                      </Badge>
                    )}
                    {user.friendship?.status === 'declined' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFriend(user.id)}
                        disabled={actionLoading === user.id}
                      >
                        Повторить
                      </Button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Друзья</span>
              {friends.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Входящие</span>
              {pendingReceived.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 bg-amber-100 text-amber-700">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Отправленные</span>
              {pendingSent.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5">
                  {pendingSent.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Friends list */}
          <TabsContent value="friends" className="mt-4 space-y-3">
            {friends.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">Пока нет друзей</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Найдите пользователей через поиск выше и добавьте их в друзья!
                </p>
              </Card>
            ) : (
              friends.map((friend, i) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                          {(friend.name || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{friend.name || 'Без имени'}</div>
                        {friend.email && (
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {friend.email}
                          </div>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {friend.stats.xp.toLocaleString('ru-RU')} XP
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {friend.stats.streak}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-500" />
                            {friend.stats.achievementsCount}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3 text-blue-500" />
                            {friend.stats.languagesCount}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(friend.friendshipId, friend.name)}
                        disabled={actionLoading === friend.friendshipId}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {actionLoading === friend.friendshipId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Pending received */}
          <TabsContent value="received" className="mt-4 space-y-3">
            {pendingReceived.length === 0 ? (
              <Card className="p-12 text-center">
                <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">Нет входящих заявок</h3>
                <p className="text-sm text-muted-foreground">
                  Здесь появятся заявки в друзья от других пользователей
                </p>
              </Card>
            ) : (
              pendingReceived.map((req, i) => (
                <motion.div
                  key={req.friendshipId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                          {(req.user.name || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{req.user.name || 'Без имени'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {req.user.email}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(req.friendshipId)}
                          disabled={actionLoading === req.friendshipId}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {actionLoading === req.friendshipId ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          Принять
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(req.friendshipId)}
                          disabled={actionLoading === req.friendshipId}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Pending sent */}
          <TabsContent value="sent" className="mt-4 space-y-3">
            {pendingSent.length === 0 ? (
              <Card className="p-12 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">Нет отправленных заявок</h3>
                <p className="text-sm text-muted-foreground">
                  Найдите друзей через поиск выше
                </p>
              </Card>
            ) : (
              pendingSent.map((req, i) => (
                <motion.div
                  key={req.friendshipId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                          {(req.user.name || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{req.user.name || 'Без имени'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {req.user.email}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Ожидает
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDecline(req.friendshipId)}
                        disabled={actionLoading === req.friendshipId}
                        className="text-muted-foreground"
                      >
                        Отмена
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Link to leaderboard */}
        <div className="text-center pt-4">
          <Link href="/community/leaderboard">
            <Button variant="outline">
              <Trophy className="w-4 h-4 mr-2" />
              Смотреть таблицу лидеров
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

