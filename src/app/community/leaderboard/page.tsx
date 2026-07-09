'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Flame, Star, Zap, Crown, Medal, Award, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Leader {
  id: string
  name: string
  avatar: string | null
  bio: string | null
  xp: number
  level: number
  streak: number
  achievementsCount: number
  languagesCount: number
  lessonsCount: number
  rank: number
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myData, setMyData] = useState<Leader | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/leaderboard?limit=50').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ])
      .then(([data, authData]) => {
        setLeaders(data.leaderboard || [])
        setMyRank(data.myRank)
        setMyData(data.myData)
        setIsAuthenticated(!!authData.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />
    return <span className="text-sm font-bold text-muted-foreground">{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { label: '🥇 1 место', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    if (rank === 2) return { label: '🥈 2 место', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    if (rank === 3) return { label: '🥉 3 место', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Лидерборд</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Топ изучающих
              </div>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">← На главную</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            🏆 Таблица лидеров
          </h1>
          <p className="text-muted-foreground">
            Топ-{leaders.length} изучающих языков по количеству XP
          </p>
        </div>

        {/* My rank card */}
        {isAuthenticated && myRank && myData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-300 dark:border-amber-800">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                  #{myRank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">Вы — {myData.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Уровень {myData.level} · {myData.xp.toLocaleString('ru-RU')} XP
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-orange-600 flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {myData.streak}
                    </div>
                    <div className="text-[10px] text-muted-foreground">стрик</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {myData.achievementsCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">награды</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Podium top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((leader, i) => {
              const rankBadge = getRankBadge(leader.rank)
              const isCenter = i === 0 // 1st place in center on desktop
              return (
                <motion.div
                  key={leader.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'order-2 md:order-1',
                    isCenter && 'md:order-2 md:scale-105'
                  )}
                >
                  <Card className={cn(
                    'p-5 text-center relative overflow-hidden',
                    leader.rank === 1 && 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/40 border-amber-300 dark:border-amber-800',
                    leader.rank === 2 && 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 border-slate-300 dark:border-slate-700',
                    leader.rank === 3 && 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40 border-orange-300 dark:border-orange-800'
                  )}>
                    <div className="absolute top-3 right-3">
                      {getRankIcon(leader.rank)}
                    </div>
                    <Avatar className={cn(
                      'w-20 h-20 mx-auto mb-3 border-4',
                      leader.rank === 1 && 'border-amber-400',
                      leader.rank === 2 && 'border-slate-400',
                      leader.rank === 3 && 'border-orange-400'
                    )}>
                      <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-2xl font-bold">
                        {leader.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg truncate">{leader.name}</h3>
                    {rankBadge && (
                      <Badge className={cn('mt-1 mb-3', rankBadge.color)}>
                        {rankBadge.label}
                      </Badge>
                    )}
                    <div className="text-2xl font-bold mb-1">
                      {leader.xp.toLocaleString('ru-RU')}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">XP · Уровень {leader.level}</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="font-bold text-sm flex items-center justify-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {leader.streak}
                        </div>
                        <div className="text-[9px] text-muted-foreground">стрик</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500" />
                          {leader.achievementsCount}
                        </div>
                        <div className="text-[9px] text-muted-foreground">награды</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center justify-center gap-0.5">
                          <Users className="w-3 h-3 text-blue-500" />
                          {leader.languagesCount}
                        </div>
                        <div className="text-[9px] text-muted-foreground">языки</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Rest of leaderboard */}
        {rest.length > 0 && (
          <Card className="overflow-hidden">
            <div className="divide-y">
              {rest.map((leader, i) => (
                <motion.div
                  key={leader.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 text-center font-bold text-muted-foreground">
                    {leader.rank}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white">
                      {leader.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{leader.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Уровень {leader.level}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {leader.streak}
                      </span>
                      <span className="hidden sm:flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500" />
                        {leader.achievementsCount}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{leader.xp.toLocaleString('ru-RU')}</div>
                    <div className="text-[10px] text-muted-foreground">XP</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {leaders.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">Пока нет лидеров</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Начните изучать языки и зарабатывайте XP, чтобы попасть в таблицу лидеров!
            </p>
            <Link href="/">
              <Button>Начать изучение</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
