'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, CheckCircle2 } from 'lucide-react'
import { ACHIEVEMENTS, useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function AchievementsPanel({ compact = false }: { compact?: boolean }) {
  const { achievements, streak, checkAchievements, activityLog } = useProgressStore()
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const unlocked = checkAchievements()
      if (unlocked.length > 0) {
        setNewlyUnlocked((prev) => [...prev, ...unlocked.map((a) => a.id)])
        // Clear notifications after 5 seconds
        setTimeout(() => {
          setNewlyUnlocked((prev) => prev.filter((id) => !unlocked.some((u) => u.id === id)))
        }, 5000)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [checkAchievements])

  const unlockedIds = new Set(achievements.map((a) => a.id))
  const unlockedCount = achievements.length
  const totalCount = ACHIEVEMENTS.length

  // Recent activity for streak chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      date: d,
      count: activityLog[key] || 0,
      label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
    }
  })

  const maxActivity = Math.max(...last7Days.map((d) => d.count), 1)

  return (
    <>
      {/* Toast notifications for new achievements */}
      <AnimatePresence>
        {newlyUnlocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 flex flex-col gap-2 pointer-events-none"
          >
            {newlyUnlocked.map((id) => {
              const ach = ACHIEVEMENTS.find((a) => a.id === id)
              if (!ach) return null
              return (
                <Card
                  key={id}
                  className="p-4 flex items-center gap-3 shadow-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 pointer-events-auto"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-2xl shrink-0">
                    {ach.icon}
                  </div>
                  <div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-medium uppercase tracking-wide">
                      Достижение разблокировано!
                    </div>
                    <div className="font-bold">{ach.title}</div>
                    <div className="text-sm text-muted-foreground">{ach.description}</div>
                  </div>
                </Card>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Streak & summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-900">
            <Flame className="w-6 h-6 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {streak.current}
            </div>
            <div className="text-xs text-muted-foreground">текущий стрик</div>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{streak.longest}</div>
            <div className="text-xs text-muted-foreground">лучший стрик</div>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
            <div className="text-2xl font-bold">{unlockedCount}</div>
            <div className="text-xs text-muted-foreground">достижений</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold mt-1">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">из {totalCount}</div>
          </Card>
        </div>

        {/* Weekly activity */}
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Активность за неделю
          </div>
          <div className="flex items-end justify-between gap-2 h-20">
            {last7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-sm min-h-[4px]"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.count / maxActivity) * 100}%` }}
                  transition={{ delay: i * 0.05 }}
                />
                <div className="text-[10px] text-muted-foreground uppercase">{day.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements grid */}
        {!compact && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">Все достижения</h3>
              </div>
              <Badge variant="outline">{unlockedCount} / {totalCount}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedIds.has(ach.id)
                return (
                  <motion.div
                    key={ach.id}
                    whileHover={isUnlocked ? { scale: 1.05 } : {}}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all',
                      isUnlocked
                        ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30'
                        : 'border-border opacity-50'
                    )}
                  >
                    <div className="text-3xl mb-1">
                      {isUnlocked ? ach.icon : '🔒'}
                    </div>
                    <div className="text-xs font-medium leading-tight">{ach.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {ach.description}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
