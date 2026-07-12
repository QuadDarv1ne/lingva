'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Brain, RotateCcw, Check, Volume2, Trophy,
  Calendar, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useProgressStore, PersonalWord } from '@/lib/store'
import { languages } from '@/lib/languages-data'
import { cn, speak as speakText } from '@/lib/utils'

type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

const qualityMap: Record<ReviewQuality, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

const qualityColors: Record<ReviewQuality, string> = {
  again: 'bg-rose-500 hover:bg-rose-600 text-white',
  hard: 'bg-amber-500 hover:bg-amber-600 text-white',
  good: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  easy: 'bg-blue-500 hover:bg-blue-600 text-white',
}

const qualityLabels: Record<ReviewQuality, string> = {
  again: 'Снова',
  hard: 'Трудно',
  good: 'Хорошо',
  easy: 'Легко',
}

interface PracticeSession {
  cards: PersonalWord[]
  currentIndex: number
  revealed: boolean
  correct: number
  wrong: number
  startTime: number
}

export default function PracticePage() {
  const { personalDictionary, reviewWordWithSRS } = useProgressStore()
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [filterLang, setFilterLang] = useState<string>('all')

  // Compute due cards
  const dueCards = useMemo(() => {
    const now = new Date()
    return personalDictionary.filter((w) => {
      if (filterLang !== 'all' && w.languageId !== filterLang) return false
      // Card is due if: no SRS data (new) OR dueDate <= now
      if (!w.srs) return true
      return new Date(w.srs.dueDate) <= now
    })
  }, [personalDictionary, filterLang])

  const newCards = dueCards.filter((c) => !c.srs || c.srs.repetitions === 0)
  const learningCards = dueCards.filter((c) => c.srs && c.srs.repetitions > 0 && c.srs.repetitions < 3)
  const reviewCards = dueCards.filter((c) => c.srs && c.srs.repetitions >= 3)

  const startSession = useCallback(() => {
    if (dueCards.length === 0) return
    // Shuffle cards
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5)
    setSession({
      cards: shuffled,
      currentIndex: 0,
      revealed: false,
      correct: 0,
      wrong: 0,
      startTime: Date.now(),
    })
  }, [dueCards])

  const speak = (text: string, langId: string) => speakText(text, langId)

  const handleReview = (quality: ReviewQuality) => {
    if (!session) return
    const card = session.cards[session.currentIndex]
    const q = qualityMap[quality]
    reviewWordWithSRS(card.id, q)

    const isCorrect = q >= 3
    setSession((prev) => {
      if (!prev) return prev
      const nextIndex = prev.currentIndex + 1
      if (nextIndex >= prev.cards.length) {
        // Session complete
        return {
          ...prev,
          correct: prev.correct + (isCorrect ? 1 : 0),
          wrong: prev.wrong + (isCorrect ? 0 : 1),
          revealed: false,
        }
      }
      return {
        ...prev,
        currentIndex: nextIndex,
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        revealed: false,
      }
    })

    if (quality === 'again') {
      // Move card to end of session for re-review
      setSession((prev) => {
        if (!prev) return prev
        const cards = [...prev.cards]
        const currentCard = cards[prev.currentIndex]
        // Insert before last position so it comes up again
        cards.splice(prev.currentIndex + 1, 0, currentCard)
        return { ...prev, cards }
      })
    }
  }

  const reveal = () => {
    setSession((prev) => prev ? { ...prev, revealed: true } : prev)
  }

  const endSession = () => {
    setSession(null)
  }

  // Session complete screen
  if (session && session.currentIndex >= session.cards.length) {
    const total = session.cards.length
    const accuracy = total > 0 ? Math.round((session.correct / total) * 100) : 0
    const duration = Math.round((Date.now() - session.startTime) / 1000)
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className={cn(
              'w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white',
              accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            )}>
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {accuracy >= 80 ? 'Отлично!' : accuracy >= 60 ? 'Хорошо!' : 'Продолжайте!'}
            </h2>
            <p className="text-muted-foreground mb-6">Сессия завершена</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{session.correct}</div>
                <div className="text-xs text-muted-foreground">правильно</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-600">{session.wrong}</div>
                <div className="text-xs text-muted-foreground">ошибок</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{accuracy}%</div>
                <div className="text-xs text-muted-foreground">точность</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-6">
              ⏱️ {minutes}:{seconds.toString().padStart(2, '0')} · {total} карточек
            </div>

            <div className="flex gap-2">
              <Button onClick={endSession} variant="outline" className="flex-1">
                Готово
              </Button>
              <Button onClick={() => { endSession(); setTimeout(startSession, 100) }} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-1" />
                Ещё раз
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Active session
  if (session) {
    const card = session.cards[session.currentIndex]
    const lang = languages.find((l) => l.id === card.languageId)
    const isRtl = lang?.direction === 'rtl'
    const progress = ((session.currentIndex) / session.cards.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-background to-background">
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Практика SRS</span>
            </div>
            <Button variant="ghost" size="sm" onClick={endSession}>
              Выйти
            </Button>
          </div>
          <div className="px-4 pb-2">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{session.currentIndex + 1} / {session.cards.length}</span>
              <span>✅ {session.correct} · ❌ {session.wrong}</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-2xl px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={session.currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-8 mb-6 min-h-[280px] flex flex-col items-center justify-center text-center relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="outline" className="text-xs">
                    {lang?.emoji} {lang?.name}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => speak(card.word, card.languageId)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Card status */}
                {card.srs && (
                  <div className="absolute bottom-4 left-4 flex gap-1">
                    {card.srs.repetitions === 0 && <Badge variant="secondary" className="text-[10px]">Новое</Badge>}
                    {card.srs.repetitions > 0 && card.srs.repetitions < 3 && <Badge variant="secondary" className="text-[10px] text-amber-600">Изучение</Badge>}
                    {card.srs.repetitions >= 3 && <Badge variant="secondary" className="text-[10px] text-emerald-600">Повторение</Badge>}
                  </div>
                )}

                <div
                  className="text-5xl font-bold mb-3"
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  {card.word}
                </div>
                {card.transcription && (
                  <div className="text-lg text-muted-foreground italic mb-4">
                    [{card.transcription}]
                  </div>
                )}

                {session.revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t w-full pt-4 mt-4"
                  >
                    <div className="text-xl font-medium">{card.translation}</div>
                  </motion.div>
                )}
              </Card>

              {/* Controls */}
              {!session.revealed ? (
                <Button
                  onClick={reveal}
                  size="lg"
                  className="w-full"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Показать ответ
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-4 gap-2"
                >
                  {(['again', 'hard', 'good', 'easy'] as ReviewQuality[]).map((q) => (
                    <Button
                      key={q}
                      onClick={() => handleReview(q)}
                      className={cn('flex flex-col h-auto py-3', qualityColors[q])}
                    >
                      <span className="text-sm font-medium">{qualityLabels[q]}</span>
                      <span className="text-[10px] opacity-80">
                        {q === 'again' ? '<1м' : q === 'hard' ? '10м' : q === 'good' ? '1д' : '4д'}
                      </span>
                    </Button>
                  ))}
                </motion.div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-4">
                💡 Оцените, насколько легко вспомнился ответ. Это влияет на интервал повторения.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Session selection screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-background to-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Практика SRS</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Интервальное повторение
              </div>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Назад</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* How it works */}
        <Card className="p-5 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-900 dark:text-purple-200 mb-1">
                Как работает интервальное повторение?
              </p>
              <p className="text-purple-800 dark:text-purple-300">
                Алгоритм SM-2 планирует повторение каждого слова в оптимальное время.
                Чем лучше вы помните слово, тем реже оно появляется. Оценивайте каждый ответ
                от «Снова» до «Легко» — это влияет на интервал.
              </p>
            </div>
          </div>
        </Card>

        {/* Due cards stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{newCards.length}</div>
            <div className="text-xs text-muted-foreground">Новые</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{learningCards.length}</div>
            <div className="text-xs text-muted-foreground">В изучении</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{reviewCards.length}</div>
            <div className="text-xs text-muted-foreground">На повторение</div>
          </Card>
        </div>

        {/* Language filter */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Фильтр по языку</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterLang === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterLang('all')}
            >
              Все языки ({personalDictionary.length})
            </Button>
            {languages.filter((l) => personalDictionary.some((w) => w.languageId === l.id)).map((l) => (
              <Button
                key={l.id}
                size="sm"
                variant={filterLang === l.id ? 'default' : 'outline'}
                onClick={() => setFilterLang(l.id)}
              >
                {l.emoji} {l.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Start button */}
        {dueCards.length > 0 ? (
          <Card className="p-6 text-center">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="font-semibold text-lg mb-2">Готовы к практике!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {dueCards.length} {dueCards.length === 1 ? 'карточка' : 'карточек'} ожидают повторения
            </p>
            <Button onClick={startSession} size="lg" className="w-full">
              <Brain className="w-5 h-5 mr-2" />
              Начать сессию ({dueCards.length})
            </Button>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {personalDictionary.length === 0 ? 'Словарик пуст' : 'Всё повторено! 🎉'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {personalDictionary.length === 0
                ? 'Добавьте слова в словарик, чтобы начать практиковаться'
                : 'Новые карточки появятся позже. Загляните завтра!'}
            </p>
            {personalDictionary.length === 0 ? (
              <Link href="/dashboard/dictionary">
                <Button>
                  <Brain className="w-4 h-4 mr-1" />
                  Добавить слова
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/dictionary">
                <Button variant="outline">
                  Открыть словарик
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Next reviews preview */}
        {personalDictionary.length > 0 && dueCards.length === 0 && (
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Ближайшие повторения
            </h3>
            <div className="space-y-2">
              {personalDictionary
                .filter((w) => w.srs)
                .sort((a, b) => new Date(a.srs?.dueDate ?? '').getTime() - new Date(b.srs?.dueDate ?? '').getTime())
                .slice(0, 5)
                .map((w) => {
                  const lang = languages.find((l) => l.id === w.languageId)
                  const due = new Date(w.srs?.dueDate ?? '')
                  const isPast = due < new Date()
                  return (
                    <div key={w.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <span className="text-lg">{lang?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{w.word}</div>
                        <div className="text-xs text-muted-foreground truncate">{w.translation}</div>
                      </div>
                      <Badge variant={isPast ? 'destructive' : 'secondary'} className="text-xs">
                        {isPast ? 'Просрочено' : due.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </Badge>
                    </div>
                  )
                })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
