'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Check, X, RotateCcw, Trophy, Volume2, Eye, EyeOff,
} from 'lucide-react'
import { Language, ReadingText } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { speak as speakText } from '@/lib/utils'
import { cn } from '@/lib/utils'

const levelColors: Record<string, string> = {
  'Начальный': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Средний': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Продвинутый': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export function ReadingSection({ language }: { language: Language }) {
  const { recordActivity, incrementTypedCorrect } = useProgressStore()
  const { toast } = useToast()
  const [selectedText, setSelectedText] = useState<ReadingText | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [answers, setAnswers] = useState<{ [qIdx: number]: number }>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const isRtl = language.direction === 'rtl'

  const speak = (text: string) => speakText(text, language.id, 0.7)

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    if (submitted) return
    setAnswers({ ...answers, [qIdx]: optIdx })
  }

  const handleSubmit = () => {
    let correct = 0
    selectedText?.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++
    })
    setScore(correct)
    setSubmitted(true)
    const total = selectedText?.questions.length || 0
    const xpGain = correct * 8
    if (correct > 0) {
      for (let i = 0; i < correct; i++) {
        incrementTypedCorrect(language.id)
      }
      recordActivity()
      toast({
        title: `Результат: ${correct}/${total} ✅`,
        description: `+${xpGain} XP за правильные ответы`,
      })
    }
  }

  const handleReset = () => {
    setSelectedText(null)
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setShowTranslation(false)
  }

  const handleRetry = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  // Text selection view
  if (!selectedText) {
    if (language.reading.length === 0) {
      return (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold mb-2">Нет текстов для чтения</h3>
          <p className="text-sm text-muted-foreground">
            Для этого языка пока нет текстов с вопросами на понимание
          </p>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Практика чтения</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Прочитайте текст на {language.name}, ответьте на вопросы и проверьте понимание. Тексты разделены по уровню сложности.
          </p>
        </Card>

        <div className="grid gap-4">
          {language.reading.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className="p-5 cursor-pointer hover:shadow-md transition-all hover:border-primary/40"
                onClick={() => setSelectedText(text)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{text.title}</h4>
                      <Badge className={cn('text-xs', levelColors[text.level])}>
                        {text.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3" dir={isRtl ? 'rtl' : 'ltr'}>
                      {text.text}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{text.text.split(' ').length} слов</span>
                      <span>·</span>
                      <span>{text.questions.length} вопросов</span>
                    </div>
                  </div>
                  <BookOpen className="w-6 h-6 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // Reading + questions view
  const total = selectedText.questions.length
  const accuracy = submitted ? Math.round((score / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              ← К текстам
            </Button>
            <h3 className="font-semibold">{selectedText.title}</h3>
          </div>
          <Badge className={cn('text-xs', levelColors[selectedText.level])}>
            {selectedText.level}
          </Badge>
        </div>
      </Card>

      {/* Text */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Текст на {language.name}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => speak(selectedText.text)}
              className="h-8"
            >
              <Volume2 className="w-4 h-4 mr-1" />
              Слушать
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTranslation((s) => !s)}
              className="h-8"
            >
              {showTranslation ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showTranslation ? 'Скрыть перевод' : 'Перевод'}
            </Button>
          </div>
        </div>
        <p
          className="text-lg leading-relaxed mb-4"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {selectedText.text}
        </p>
        <AnimatePresence>
          {showTranslation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-3"
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Перевод
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedText.translation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Questions */}
      <Card className="p-5">
        <h4 className="font-semibold mb-4">Вопросы на понимание</h4>
        <div className="space-y-4">
          {selectedText.questions.map((q, qIdx) => {
            const userAnswer = answers[qIdx]
            const isCorrect = submitted && userAnswer === q.correct
            const isWrong = submitted && userAnswer !== undefined && userAnswer !== q.correct
            return (
              <div key={qIdx} className="space-y-2">
                <div className="font-medium text-sm">
                  {qIdx + 1}. {q.question}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAnswer === optIdx
                    const showCorrect = submitted && optIdx === q.correct
                    const showWrong = submitted && isSelected && optIdx !== q.correct
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(qIdx, optIdx)}
                        disabled={submitted}
                        className={cn(
                          'p-3 rounded-lg border-2 text-left text-sm transition-all',
                          !submitted && isSelected && 'border-primary bg-primary/5',
                          !submitted && !isSelected && 'border-border hover:border-primary/40',
                          showCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                          showWrong && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
                          submitted && !showCorrect && !showWrong && 'border-border opacity-60'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {showCorrect && <Check className="w-4 h-4 text-emerald-500" />}
                          {showWrong && <X className="w-4 h-4 text-rose-500" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'text-xs p-2 rounded',
                      isCorrect
                        ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'text-amber-700 bg-amber-50 dark:bg-amber-950/30'
                    )}
                  >
                    {isCorrect ? '✅ ' : '💡 '}
                    {q.explanation}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Submit / Results */}
      {!submitted ? (
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={Object.keys(answers).length < total}
        >
          <Check className="w-4 h-4 mr-2" />
          Проверить ответы ({Object.keys(answers).length}/{total})
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 text-center">
            <div className={cn(
              'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white',
              accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            )}>
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-1">
              {accuracy >= 80 ? 'Отлично!' : accuracy >= 60 ? 'Хорошо!' : 'Попробуйте ещё'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Правильно: {score} из {total} · Точность: {accuracy}%
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Пройти заново
              </Button>
              <Button className="flex-1" onClick={handleReset}>
                К другим текстам
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
