'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function QuizSection({ language }: { language: Language }) {
  const { recordQuizScore, getLanguageProgress, recordActivity, updateDailyChallenge } = useProgressStore()
  const progress = getLanguageProgress(language.id)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const total = language.quiz.length
  const question = language.quiz[current]
  const bestScore = progress.completedQuizzes[language.id] || 0

  const handleSelect = (i: number) => {
    if (showResult) return
    setSelected(i)
    setShowResult(true)
    if (i === question.correct) {
      setScore((s) => s + 1)
    }
    recordActivity()
  }

  const handleNext = () => {
    if (current + 1 >= total) {
      const finalScore = Math.round((score / total) * 100)
      recordQuizScore(language.id, language.id, finalScore)
      if (finalScore >= 80) {
        updateDailyChallenge('quiz', 1)
      }
      setFinished(true)
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setShowResult(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const finalScore = Math.round((score / total) * 100)
    const isExcellent = finalScore >= 80
    const isGood = finalScore >= 60 && finalScore < 80
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className={cn(
            'w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white',
            isExcellent ? 'bg-emerald-500' : isGood ? 'bg-amber-500' : 'bg-rose-500'
          )}>
            {isExcellent ? <Trophy className="w-10 h-10" /> : <Award className="w-10 h-10" />}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {isExcellent ? 'Отлично!' : isGood ? 'Хорошо!' : 'Попробуйте ещё раз'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Вы ответили правильно на {score} из {total} вопросов
          </p>
          <div className="text-4xl font-bold mb-1">{finalScore}%</div>
          <div className="text-sm text-muted-foreground mb-6">
            {bestScore > finalScore
              ? `Лучший результат: ${bestScore}%`
              : 'Новый личный рекорд!'}
          </div>
          <Button onClick={handleRestart} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Пройти заново
          </Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Тест по языку</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Проверьте свои знания. {total} вопросов.
            </p>
          </div>
          {bestScore > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Лучший: {bestScore}%
            </Badge>
          )}
        </div>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Вопрос {current + 1} из {total}</span>
          <span>Очки: {score}</span>
        </div>
        <Progress value={((current + 1) / total) * 100} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-5">
              {question.question}
            </h4>
            <div className="space-y-2">
              {question.options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrect = i === question.correct
                const showCorrect = showResult && isCorrect
                const showWrong = showResult && isSelected && !isCorrect
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={showResult}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between gap-3',
                      !showResult && 'hover:border-primary/50 hover:bg-muted/50',
                      showCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                      showWrong && 'border-rose-500 bg-rose-50 dark:bg-rose-900/20',
                      !showCorrect && !showWrong && 'border-border'
                    )}
                  >
                    <span className="font-medium">{opt}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {showWrong && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">→</span>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </motion.div>
            )}

            {showResult && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleNext}>
                  {current + 1 >= total ? 'Завершить тест' : 'Следующий вопрос'}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
