'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Languages, Brain, Trophy, Users, Mic, BookOpen,
  ChevronRight, ChevronLeft, X, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ONBOARDING_KEY = 'lingva-onboarding-completed'

interface OnboardingStep {
  icon: typeof Languages
  title: string
  description: string
  color: string
  emoji: string
}

const steps: OnboardingStep[] = [
  {
    icon: Languages,
    title: '7 языков в одной платформе',
    description: 'Изучайте русский, китайский, арамейский, английский, греческий, славянский и церковнославянский. От древних до современных — все в одном месте.',
    color: 'from-rose-500 to-amber-500',
    emoji: '🌍',
  },
  {
    icon: BookOpen,
    title: '16 вкладок на каждый язык',
    description: 'Алфавит, фразы, уроки, флеш-карты, практика письма, печать, мини-игры, чтение, произношение, культура, AI-чат и тесты — выберите свой путь.',
    color: 'from-blue-500 to-cyan-500',
    emoji: '📚',
  },
  {
    icon: Brain,
    title: 'SRS — интервальное повторение',
    description: 'Алгоритм SM-2 (как в Anki) планирует повторение слов в оптимальное время. Добавляйте слова в словарик и практикуйте их с умом.',
    color: 'from-purple-500 to-pink-500',
    emoji: '🧠',
  },
  {
    icon: Trophy,
    title: 'Геймификация и турниры',
    description: 'Зарабатывайте XP, открывайте 21 достижение, участвуйте в еженедельных турнирах. Тратьте XP в магазине на заморозки стрика и бонусы.',
    color: 'from-amber-500 to-orange-500',
    emoji: '🏆',
  },
  {
    icon: Users,
    title: 'Социальные функции',
    description: 'Добавляйте друзей, сравнивайте прогресс в таблице лидеров, получайте уведомления. Изучение языков веселее вместе!',
    color: 'from-emerald-500 to-teal-500',
    emoji: '👥',
  },
  {
    icon: Mic,
    title: 'AI-преподаватель',
    description: 'Задайте любой вопрос о языке. ИИ объяснит грамматику, подскажет перевод и попрактикует с вами в диалоге. 3 режима: преподаватель, носитель, экзаменатор.',
    color: 'from-indigo-500 to-purple-500',
    emoji: '🤖',
  },
]

export function Onboarding() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return !localStorage.getItem(ONBOARDING_KEY)
    } catch {
      return false
    }
  })
  const [step, setStep] = useState(0)

  const handleComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleNext = () => {
    if (step + 1 >= steps.length) {
      handleComplete()
    } else {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!visible) return null

  const currentStep = steps[step]
  const Icon = currentStep.icon
  const _progress = ((step + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="overflow-hidden">
          {/* Gradient header */}
          <div className={cn('bg-gradient-to-br p-8 text-center relative', currentStep.color)}>
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Пропустить"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-6xl mb-3">{currentStep.emoji}</div>
              </motion.div>
            </AnimatePresence>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
              <Icon className="w-3 h-3" />
              Шаг {step + 1} из {steps.length}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === step ? 'w-8 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Шаг ${i + 1}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h2 className="text-xl font-bold mb-3">{currentStep.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStep.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={step === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </Button>

              <span className="text-xs text-muted-foreground">
                {step + 1} / {steps.length}
              </span>

              {step + 1 >= steps.length ? (
                <Button onClick={handleComplete} className="flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Начать!
                </Button>
              ) : (
                <Button onClick={handleNext} className="flex items-center gap-1">
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Skip */}
            {step < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4"
              >
                Пропустить онбординг
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
