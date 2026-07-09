'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Shuffle, Check, X, RotateCcw, Trophy, Loader2, Volume2 } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { cn, speak as speakText } from '@/lib/utils'

interface ScrambleWord {
  original: string
  scrambled: string[]
  translation: string
  transcription: string
}

function scramble(text: string): string[] {
  const chars = text.split('')
  // Fisher-Yates shuffle, ensure it's different from original
  let attempts = 0
  let shuffled: string[]
  do {
    shuffled = [...chars]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    attempts++
  } while (shuffled.join('') === chars.join('') && attempts < 10 && chars.length > 1)
  return shuffled
}

export function WordScramble({ language }: { language: Language }) {
  const { recordActivity, updateDailyChallenge, incrementMatchedWords } = useProgressStore()
  const { toast } = useToast()
  const isRtl = language.direction === 'rtl'

  // Build pool from vocabulary
  const pool: ScrambleWord[] = useMemo(() => {
    const words: ScrambleWord[] = []
    language.lessons.forEach((lesson) => {
      lesson.vocabulary.forEach((v) => {
        if (v.word.length >= 3 && v.word.length <= 12) {
          words.push({
            original: v.word,
            scrambled: scramble(v.word),
            translation: v.translation,
            transcription: v.transcription,
          })
        }
      })
    })
    language.phrases.forEach((p) => {
      if (p.original.length >= 3 && p.original.length <= 12) {
        words.push({
          original: p.original,
          scrambled: scramble(p.original),
          translation: p.translation,
          transcription: p.transcription,
        })
      }
    })
    return words.sort(() => Math.random() - 0.5).slice(0, 10)
  }, [language])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const current = pool[currentIdx]

  const speak = useCallback((text: string) => {
    speakText(text, language.id)
  }, [language.id])

  const handleSelectChar = (charIdx: number) => {
    if (selected.includes(charIdx)) return
    setSelected([...selected, charIdx])
  }

  const handleRemoveChar = (pos: number) => {
    setSelected(selected.filter((_, i) => i !== pos))
  }

  const handleSubmit = () => {
    const answer = selected.map((i) => current.scrambled[i]).join('')
    if (answer === current.original) {
      setCorrect((c) => c + 1)
      incrementMatchedWords(language.id, 1)
      recordActivity()
      updateDailyChallenge('matching', 1)
      toast({ title: 'Правильно! ✅', description: `+6 XP` })
      nextWord()
    } else {
      setWrong((w) => w + 1)
      toast({ title: 'Неверно ❌', description: `Правильный ответ: ${current.original}`, variant: 'destructive' })
      setTimeout(nextWord, 1500)
    }
  }

  const nextWord = () => {
    setSelected([])
    setShowHint(false)
    if (currentIdx + 1 >= pool.length) {
      setFinished(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const restart = () => {
    setCurrentIdx(0)
    setSelected([])
    setCorrect(0)
    setWrong(0)
    setFinished(false)
    setShowHint(false)
  }

  if (pool.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Недостаточно слов для этой игры</p>
      </Card>
    )
  }

  if (finished) {
    const accuracy = pool.length > 0 ? Math.round((correct / pool.length) * 100) : 0
    return (
      <Card className="p-8 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
        <h3 className="text-xl font-bold mb-2">Игра окончена!</h3>
        <p className="text-muted-foreground mb-4">{correct} из {pool.length} правильно</p>
        <div className="text-3xl font-bold mb-4">{accuracy}%</div>
        <Button onClick={restart}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Играть снова
        </Button>
      </Card>
    )
  }

  const progress = (currentIdx / pool.length) * 100
  const currentAnswer = selected.map((i) => current.scrambled[i]).join('')

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-primary" />
            Word Scramble
          </h3>
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary">✅ {correct}</Badge>
            <Badge variant="secondary">❌ {wrong}</Badge>
            <Badge variant="outline">{currentIdx + 1}/{pool.length}</Badge>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mb-4" />

        {/* Translation hint */}
        <div className="text-center mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Перевод</div>
          <div className="text-lg font-medium">{current.translation}</div>
          {showHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-amber-600 mt-1"
            >
              Подсказка: {current.transcription}
            </motion.div>
          )}
        </div>

        {/* Answer slots */}
        <div className="flex justify-center gap-1 flex-wrap mb-4 min-h-[3rem]">
          {Array.from({ length: current.original.length }).map((_, i) => {
            const char = selected[i] !== undefined ? current.scrambled[selected[i]] : null
            return (
              <button
                key={i}
                onClick={() => char && handleRemoveChar(i)}
                className={cn(
                  'w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all',
                  char
                    ? 'bg-primary text-primary-foreground border-primary cursor-pointer hover:bg-primary/80'
                    : 'border-dashed border-border'
                )}
                disabled={!char}
              >
                {char}
              </button>
            )
          })}
        </div>

        {/* Scrambled letters */}
        <div className="flex justify-center gap-1 flex-wrap mb-4">
          {current.scrambled.map((char, i) => {
            const used = selected.includes(i)
            return (
              <button
                key={i}
                onClick={() => handleSelectChar(i)}
                disabled={used}
                className={cn(
                  'w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all',
                  used
                    ? 'opacity-30 border-muted'
                    : 'bg-card border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                )}
              >
                {char}
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setSelected([]); setShowHint(false) }}
            className="flex-1"
            disabled={selected.length === 0}
          >
            <X className="w-4 h-4 mr-1" />
            Очистить
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowHint(true)}
            className="text-amber-600"
          >
            Подсказка
          </Button>
          <Button
            variant="ghost"
            onClick={() => speak(current.original)}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.length !== current.original.length}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Проверить
          </Button>
        </div>
      </Card>
    </div>
  )
}
