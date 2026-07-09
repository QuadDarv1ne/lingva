'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Volume2, X } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function AlphabetSection({ language }: { language: Language }) {
  const [selected, setSelected] = useState<number | null>(null)
  const { markLetterLearned, getLanguageProgress, recordActivity, updateDailyChallenge } = useProgressStore()
  const progress = getLanguageProgress(language.id)
  const isRtl = language.direction === 'rtl'

  const handleLetterClick = (i: number) => {
    setSelected(i)
    const letter = language.alphabet[i].letter
    const wasLearned = progress.learnedLetters.includes(letter)
    markLetterLearned(language.id, letter)
    recordActivity()
    if (!wasLearned) {
      updateDailyChallenge('letters', 1)
    }
  }

  // Try to speak the letter using Web Speech API
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.7
      utterance.lang = language.id === 'russian' ? 'ru-RU'
        : language.id === 'chinese' ? 'zh-CN'
        : language.id === 'english' ? 'en-US'
        : language.id === 'greek' ? 'el-GR'
        : 'ru-RU'
      window.speechSynthesis.speak(utterance)
    }
  }

  const letter = selected !== null ? language.alphabet[selected] : null
  const learnedCount = progress.learnedLetters.length
  const totalLetters = language.alphabet.length
  const learnPct = Math.round((learnedCount / totalLetters) * 100)

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Алфавит — {language.nativeName}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Нажмите на символ, чтобы услышать произношение и увидеть пример
          </p>
        </div>
        <div className="flex flex-col gap-1 min-w-48">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Изучено букв</span>
            <span className="font-medium">{learnedCount} / {totalLetters}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full bg-gradient-to-r', language.gradient)}
              animate={{ width: `${learnPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </Card>

      {/* Letter grid */}
      <div
        className={cn(
          'grid gap-2',
          'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
        )}
      >
        {language.alphabet.map((l, i) => {
          const isLearned = progress.learnedLetters.includes(l.letter)
          const isSelected = selected === i
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLetterClick(i)}
              className={cn(
                'aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-colors relative',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-card',
                isLearned && 'ring-1 ring-primary/30'
              )}
            >
              {isLearned && (
                <Check className="absolute top-1 right-1 w-3 h-3 text-primary" />
              )}
              <div
                className={cn(
                  'text-2xl font-semibold leading-none mb-1',
                  isRtl && 'text-3xl'
                )}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {l.letter}
              </div>
              <div className="text-[10px] text-muted-foreground truncate w-full text-center">
                {l.transcription}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Selected letter detail */}
      <AnimatePresence>
        {letter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Big letter */}
                <div className={cn(
                  'shrink-0 w-32 h-32 rounded-xl flex items-center justify-center text-white',
                  `bg-gradient-to-br ${language.gradient}`
                )}>
                  <span
                    className="text-7xl font-bold"
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    {letter.letter}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{letter.name}</h3>
                    <Badge variant="outline" className="mt-2">
                      /{letter.transcription}/
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Пример
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-2xl font-medium"
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        {letter.example}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => speak(letter.example)}
                        className="h-8 w-8"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {letter.exampleTranslation}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => speak(letter.letter)}
                      className="flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Произнести
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelected(null)}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Закрыть
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
