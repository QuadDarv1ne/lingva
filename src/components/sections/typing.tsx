'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Keyboard, Check, X, RotateCcw, Trophy, Zap } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface TypingRound {
  word: string
  transcription: string
  translation: string
}

export function TypingSection({ language }: { language: Language }) {
  const { incrementTypedCorrect, recordActivity, getLanguageProgress } = useProgressStore()
  const progress = getLanguageProgress(language.id)
  const isRtl = language.direction === 'rtl'

  // Generate rounds from phrases and vocabulary
  const rounds: TypingRound[] = useMemo(() => {
    const items: TypingRound[] = []
    language.phrases.forEach((p) => {
      items.push({
        word: p.original,
        transcription: p.transcription,
        translation: p.translation,
      })
    })
    language.lessons.forEach((lesson) => {
      lesson.vocabulary.forEach((v) => {
        items.push({
          word: v.word,
          transcription: v.transcription,
          translation: v.translation,
        })
      })
    })
    return items.sort(() => Math.random() - 0.5).slice(0, 15)
  }, [language])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 })
  const [finished, setFinished] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentRound = rounds[currentIndex]

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (result) return

    const userInput = input.trim()
    const isCorrect = userInput === currentRound.word || userInput.toLowerCase() === currentRound.word.toLowerCase()

    setResult(isCorrect ? 'correct' : 'wrong')
    setStats((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1),
      total: s.total + 1,
    }))

    if (isCorrect) {
      incrementTypedCorrect(language.id)
      recordActivity()
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= rounds.length) {
      setFinished(true)
    } else {
      setCurrentIndex((c) => c + 1)
      setInput('')
      setResult(null)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setInput('')
    setResult(null)
    setStats({ correct: 0, wrong: 0, total: 0 })
    setFinished(false)
  }

  if (finished) {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    const isExcellent = accuracy >= 80
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className={cn(
            'w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white',
            isExcellent ? 'bg-emerald-500' : 'bg-amber-500'
          )}>
            <Trophy className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {isExcellent ? 'Отлично!' : 'Хорошая попытка!'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Правильно: {stats.correct} из {stats.total}
          </p>
          <div className="text-4xl font-bold mb-1">{accuracy}%</div>
          <div className="text-sm text-muted-foreground mb-6">точность</div>
          <Button onClick={handleRestart} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Заново
          </Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Клавиатурный тренажёр</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Напечатайте слово или фразу на {language.name} точно как в оригинале
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.correct}</div>
              <div className="text-xs text-muted-foreground">правильно</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-600">{stats.wrong}</div>
              <div className="text-xs text-muted-foreground">ошибок</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{progress.typedCorrectly}</div>
              <div className="text-xs text-muted-foreground">всего</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <Badge variant="outline">
          {currentIndex + 1} / {rounds.length}
        </Badge>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${((currentIndex + 1) / rounds.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current word */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="p-8 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Перевод
            </div>
            <div className="text-xl font-medium mb-6">
              {currentRound.translation}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Напишите на {language.name}
            </div>
            <div
              className="text-5xl font-bold mb-3"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {result ? currentRound.word : '•'.repeat(currentRound.word.length)}
            </div>
            <div className="text-sm text-muted-foreground italic mb-6">
              [{currentRound.transcription}]
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={result !== null}
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder="Напечатайте здесь..."
                className={cn(
                  'text-center text-lg font-medium h-12',
                  result === 'correct' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                  result === 'wrong' && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                )}
              />
              {result === null ? (
                <Button type="submit" className="mt-3 w-full" disabled={!input.trim()}>
                  <Check className="w-4 h-4 mr-2" />
                  Проверить
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className={cn(
                    'p-3 rounded-lg flex items-center gap-2',
                    result === 'correct'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                  )}>
                    {result === 'correct' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    <span className="text-sm font-medium">
                      {result === 'correct'
                        ? `Правильно! +4 XP`
                        : `Неправильно. Правильный ответ: ${currentRound.word}`}
                    </span>
                  </div>
                  <Button onClick={handleNext} className="w-full">
                    {currentIndex + 1 >= rounds.length ? 'Завершить' : 'Дальше'}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Tip */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Совет</p>
            <p className="text-muted-foreground">
              Для языков с RTL-письмом (арамейский) текст вводится справа налево.
              Для китайского используйте пиньинь или вставляйте иероглифы через буфер обмена.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
