'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check, X, RotateCcw, Trophy, Volume2, Wand2 } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FillBlankQuestion {
  sentence: string // with ___ for the blank
  answer: string
  options: string[]
  translation: string
  transcription: string
}

export function FillInTheBlank({ language }: { language: Language }) {
  const { recordActivity, updateDailyChallenge, incrementTypedCorrect } = useProgressStore()
  const { toast } = useToast()
  const isRtl = language.direction === 'rtl'

  // Build questions from vocabulary: create sentences using words
  const questions: FillBlankQuestion[] = useMemo(() => {
    const qs: FillBlankQuestion[] = []
    const allWords: { word: string; translation: string; transcription: string }[] = []

    language.lessons.forEach((lesson) => {
      lesson.vocabulary.forEach((v) => {
        allWords.push({ word: v.word, translation: v.translation, transcription: v.transcription })
      })
    })
    language.phrases.forEach((p) => {
      if (p.original.split(' ').length <= 4) {
        allWords.push({ word: p.original, translation: p.translation, transcription: p.transcription })
      }
    })

    // Create questions — pick a word, blank it out
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10)
    for (const wordObj of shuffled) {
      // Generate 3 distractors from other words
      const distractors = allWords
        .filter((w) => w.word !== wordObj.word && w.word.length <= wordObj.word.length + 3)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word)

      const options = [...distractors, wordObj.word].sort(() => Math.random() - 0.5)

      qs.push({
        sentence: `___ — ${wordObj.translation}`,
        answer: wordObj.word,
        options,
        translation: wordObj.translation,
        transcription: wordObj.transcription,
      })
    }
    return qs
  }, [language])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = questions[currentIdx]

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.lang = language.id === 'russian' ? 'ru-RU'
        : language.id === 'chinese' ? 'zh-CN'
        : language.id === 'english' ? 'en-US'
        : language.id === 'greek' ? 'el-GR'
        : 'ru-RU'
      window.speechSynthesis.speak(utterance)
    }
  }, [language.id])

  const handleSelect = (option: string) => {
    if (showResult) return
    setSelected(option)
    setShowResult(true)

    const isCorrect = option === current.answer
    if (isCorrect) {
      setCorrect((c) => c + 1)
      incrementTypedCorrect(language.id)
      recordActivity()
      updateDailyChallenge('letters', 1)
      toast({ title: 'Правильно! ✅', description: '+4 XP' })
    } else {
      setWrong((w) => w + 1)
      toast({
        title: 'Неверно ❌',
        description: `Правильный ответ: ${current.answer}`,
        variant: 'destructive',
      })
    }
  }

  const handleNext = () => {
    setSelected(null)
    setShowResult(false)
    if (currentIdx + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const restart = () => {
    setCurrentIdx(0)
    setSelected(null)
    setShowResult(false)
    setCorrect(0)
    setWrong(0)
    setFinished(false)
  }

  if (questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Недостаточно слов для этой игры</p>
      </Card>
    )
  }

  if (finished) {
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    return (
      <Card className="p-8 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
        <h3 className="text-xl font-bold mb-2">Игра окончена!</h3>
        <p className="text-muted-foreground mb-4">{correct} из {questions.length} правильно</p>
        <div className="text-3xl font-bold mb-4">{accuracy}%</div>
        <Button onClick={restart}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Играть снова
        </Button>
      </Card>
    )
  }

  const progress = (currentIdx / questions.length) * 100

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Fill in the Blank
          </h3>
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary">✅ {correct}</Badge>
            <Badge variant="secondary">❌ {wrong}</Badge>
            <Badge variant="outline">{currentIdx + 1}/{questions.length}</Badge>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mb-4" />

        {/* Question */}
        <div className="text-center mb-6 py-8 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Заполните пропуск</div>
          <div className="text-2xl font-medium" dir={isRtl ? 'rtl' : 'ltr'}>
            {current.sentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block mx-1 px-3 py-0.5 border-b-2 border-primary text-primary font-bold">
                    {showResult ? current.answer : '???'}
                  </span>
                )}
              </span>
            ))}
          </div>
          {showResult && (
            <div className="text-sm text-muted-foreground italic mt-2">
              /{current.transcription}/
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {current.options.map((option, i) => {
            const isSelected = selected === option
            const isCorrect = option === current.answer
            const showCorrect = showResult && isCorrect
            const showWrong = showResult && isSelected && !isCorrect
            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-lg font-medium',
                  !showResult && 'hover:border-primary hover:bg-primary/5 cursor-pointer',
                  showCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700',
                  showWrong && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700',
                  !showCorrect && !showWrong && 'border-border',
                )}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => speak(current.answer)}
            disabled={!showResult}
            className="flex-1"
          >
            <Volume2 className="w-4 h-4 mr-1" />
            Произнести
          </Button>
          {showResult && (
            <Button onClick={handleNext} className="flex-1">
              {currentIdx + 1 >= questions.length ? 'Завершить' : 'Дальше'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
