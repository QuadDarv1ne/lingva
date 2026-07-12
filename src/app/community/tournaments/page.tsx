'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Trophy, Loader2, Crown, Medal, Award, Users, Flame, Zap, Calendar,
  Target, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TournamentUser {
  rank: number
  userId: string
  name: string | null
  avatar: string | null
  score: number
  isMe: boolean
}

interface Tournament {
  id: string
  title: string
  description: string
  type: string
  startDate: string
  endDate: string
  prize: string | null
  participantsCount: number
  topUsers: TournamentUser[]
  daysLeft: number
}

interface Participation {
  tournamentId: string
  score: number
  joinedAt: string
  tournament: {
    id: string
    title: string
    type: string
    endDate: string
    isActive: boolean
  }
}

export default function TournamentsPage() {
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [myParticipations, setMyParticipations] = useState<Participation[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const [tournRes, authRes] = await Promise.all([
        fetch('/api/tournaments'),
        fetch('/api/auth/me'),
      ])
      const [tournData, authData] = await Promise.all([
        tournRes.json(),
        authRes.json(),
      ])
      setTournaments(tournData.tournaments || [])
      setMyParticipations(tournData.myParticipations || [])
      if (authData.user) setAuthUser(authData.user)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const handleJoin = async (tournamentId: string) => {
    setJoining(tournamentId)
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      toast({ title: 'Вы участвуете! 🎉' })
      load()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    } finally {
      setJoining(null)
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Турниры</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Соревнования
              </div>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">← На главную</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {!authUser && (
          <Card className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h2 className="font-semibold mb-2">Войдите для участия</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Чтобы участвовать в турнирах, необходимо войти в аккаунт
            </p>
            <Link href="/auth/login">
              <Button>Войти</Button>
            </Link>
          </Card>
        )}

        {tournaments.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">Нет активных турниров</h3>
            <p className="text-sm text-muted-foreground">
              Скоро начнётся новый турнир!
            </p>
          </Card>
        ) : (
          tournaments.map((t, i) => {
            const isParticipating = myParticipations.some((p) => p.tournamentId === t.id)
            const myRank = t.topUsers.find((u) => u.isMe)?.rank
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden">
                  {/* Header gradient */}
                  <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          {t.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                      </div>
                      {t.daysLeft > 0 && (
                        <Badge variant="outline" className="shrink-0">
                          <Calendar className="w-3 h-3 mr-1" />
                          {t.daysLeft} дн.
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      {t.prize && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Приз: {t.prize}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        <Users className="w-3 h-3 mr-1" />
                        {t.participantsCount} участников
                      </Badge>
                      {isParticipating && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Target className="w-3 h-3 mr-1" />
                          Вы участвуете {myRank ? `(#${myRank})` : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Top users */}
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Топ-10 лидеров
                    </h3>
                    {t.topUsers.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Пока нет участников. Станьте первым!
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {t.topUsers.map((user, idx) => (
                          <div
                            key={user.userId}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg',
                              user.isMe
                                ? 'bg-primary/10 border border-primary/30'
                                : idx < 3
                                ? 'bg-muted/30'
                                : ''
                            )}
                          >
                            <div className="w-8 text-center font-bold text-sm">
                              {user.rank === 1 ? (
                                <Crown className="w-5 h-5 mx-auto text-amber-500" />
                              ) : user.rank === 2 ? (
                                <Medal className="w-5 h-5 mx-auto text-slate-400" />
                              ) : user.rank === 3 ? (
                                <Award className="w-5 h-5 mx-auto text-orange-600" />
                              ) : (
                                user.rank
                              )}
                            </div>
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">
                                {(user.name || '?')[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {user.name || 'Аноним'}
                                {user.isMe && (
                                  <span className="text-xs text-primary ml-1">(Вы)</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" />
                                {user.score.toLocaleString('ru-RU')}
                              </div>
                              <div className="text-[10px] text-muted-foreground">XP</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Join button */}
                    {authUser && !isParticipating && t.daysLeft > 0 && (
                      <Button
                        onClick={() => handleJoin(t.id)}
                        disabled={joining === t.id}
                        className="w-full mt-4"
                      >
                        {joining === t.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Trophy className="w-4 h-4 mr-1" />
                        )}
                        Участвовать
                      </Button>
                    )}
                    {isParticipating && (
                      <Link href="/" className="block mt-4">
                        <Button variant="outline" className="w-full">
                          <Flame className="w-4 h-4 mr-1 text-orange-500" />
                          Заработать XP
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}

        {/* Link to leaderboard */}
        <div className="text-center pt-4">
          <Link href="/community/leaderboard">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Всеобщий лидерборд
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
