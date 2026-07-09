'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Star, Zap, Target, Check, RefreshCw, Calendar } from 'lucide-react'
import {
  useProgressStore,
  getLevelFromXP,
  getLevelTitle,
  XP_REWARDS,
} from '@/lib/store'
import { cn } from '@/lib/utils'

const typeIcon: { [key: string]: string } = {
  letters: '🔤',
  flashcards: '🃏',
  quiz: '🏆',
  writing: '🖌️',
  matching: '🔗',
  chat: '💬',
}

export function XPDailyPanel() {
  const {
    xp,
    dailyChallenges,
    generateDailyChallenges,
    checkAchievements,
  } = useProgressStore()

  // Generate daily challenges on mount if not yet
  useEffect(() => {
    generateDailyChallenges()
  }, [generateDailyChallenges])

  // Check achievements periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkAchievements()
    }, 3000)
    return () => clearInterval(interval)
  }, [checkAchievements])

  const { level, current, needed, pct } = getLevelFromXP(xp)
  const title = getLevelTitle(level)
  const completedDailies = dailyChallenges.filter((c) => c.completed).length

  return (
    <div className="space-y-4">
      {/* XP & Level */}
      <Card className="p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              >
                <Star className="w-7 h-7 text-white fill-white" />
              </motion.div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Уровень {level} · {title}
                </div>
                <div className="text-3xl font-bold">
                  {xp.toLocaleString('ru-RU')} <span className="text-base text-muted-foreground font-normal">XP</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">До следующего уровня</div>
              <div className="text-lg font-semibold">
                {needed - current} XP
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{current} / {needed} XP</span>
              <span>{pct}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* XP rewards info */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              За что начисляется XP
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Буква', xp: XP_REWARDS.letterLearned },
                { label: 'Урок', xp: XP_REWARDS.lessonVisited },
                { label: 'Карточка', xp: XP_REWARDS.flashcardStudied },
                { label: 'Знаю', xp: XP_REWARDS.flashcardKnown },
                { label: 'Тест 100%', xp: XP_REWARDS.quizPerfect },
                { label: 'Пара', xp: XP_REWARDS.matchedWord },
                { label: 'Символ', xp: XP_REWARDS.writtenCharacter },
                { label: 'Чат', xp: XP_REWARDS.chatMessage },
                { label: 'Печать', xp: XP_REWARDS.typedCorrect },
              ].map((item) => (
                <Badge key={item.label} variant="outline" className="text-[10px]">
                  {item.label} +{item.xp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Daily challenges */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Задания дня</h3>
            <Badge variant="secondary" className="text-xs">
              {completedDailies} / {dailyChallenges.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateDailyChallenges()}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Обновить
          </Button>
        </div>

        {dailyChallenges.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Загрузка заданий...
          </div>
        ) : (
          <div className="space-y-2">
            {dailyChallenges.map((challenge) => {
              const pctCh = Math.round((challenge.progress / challenge.target) * 100)
              return (
                <motion.div
                  key={challenge.id}
                  layout
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    challenge.completed
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl shrink-0">
                      {typeIcon[challenge.type] || '⭐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{challenge.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            +{challenge.xpReward} XP
                          </Badge>
                          {challenge.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {challenge.description}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={pctCh}
                          className={cn(
                            'h-1.5 flex-1',
                            challenge.completed && '[&>div]:bg-emerald-500'
                          )}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {challenge.progress} / {challenge.target}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
