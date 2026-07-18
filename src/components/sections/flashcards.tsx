'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Layers, RotateCw, ChevronLeft, ChevronRight, Check, Volume2 } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn, speak as speakText } from '@/lib/utils'

interface Flashcard {
  front: string
  back: string
  transcription?: string
}

export function FlashcardsSection({ language }: { language: Language }) {
  const { incrementFlashcards, incrementFlashcardsKnown, getLanguageProgress, recordActivity, updateDailyChallenge } = useProgressStore()
  const progress = getLanguageProgress(language.id)
  const isRtl = language.direction === 'rtl'

  // Build flashcards from vocabulary of all lessons + phrases
  const flashcards: Flashcard[] = useMemo(() => {
    const cards: Flashcard[] = []
    language.lessons.forEach((lesson) => {
      lesson.vocabulary.forEach((v) => {
        cards.push({
          front: v.word,
          back: v.translation,
          transcription: v.transcription,
        })
      })
    })
    language.phrases.forEach((p) => {
      cards.push({
        front: p.original,
        back: p.translation,
        transcription: p.transcription,
      })
    })
    // shuffle
    return [...cards].sort(() => Math.random() - 0.5)
  }, [language])

  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current)
    }
  }, [])

  const card = flashcards[current]

  if (!card) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Нет карточек для изучения</p>
      </Card>
    )
  }

  const totalCount = flashcards.length
  const progressPct = Math.round(((current + 1) / totalCount) * 100)

  const handleNext = () => {
    incrementFlashcards(language.id)
    recordActivity()
    updateDailyChallenge('flashcards', 1)
    setFlipped(false)
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current)
    flipTimerRef.current = setTimeout(() => {
      setCurrent((c) => (c + 1) % totalCount)
    }, 150)
  }
  const handlePrev = () => {
    setFlipped(false)
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current)
    flipTimerRef.current = setTimeout(() => {
      setCurrent((c) => (c - 1 + totalCount) % totalCount)
    }, 150)
  }
  const handleFlip = () => setFlipped((f) => !f)
  const handleKnown = () => {
    setKnownCount((k) => k + 1)
    incrementFlashcardsKnown(language.id)
    handleNext()
  }

  const speak = (text: string) => speakText(text, language.id)

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Флеш-карты</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Карточки для запоминания слов и фраз. Нажмите, чтобы перевернуть.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{progress.flashcardsStudied}</div>
              <div className="text-xs text-muted-foreground">изучено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{knownCount}</div>
              <div className="text-xs text-muted-foreground">знаю</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Badge variant="outline">
            Карточка {current + 1} / {totalCount}
          </Badge>
          <div className="flex-1 mx-4">
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current + (flipped ? '-back' : '-front')}
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -180, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="[transform-style:preserve-3d]"
          >
            <Card
              onClick={handleFlip}
              className={cn(
                'relative h-72 md:h-80 flex flex-col items-center justify-center cursor-pointer overflow-hidden border-2 hover:border-primary/50 transition-colors',
                `bg-gradient-to-br ${language.gradient} text-white`
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }}
            >
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {flipped ? 'Перевод' : 'Слово'}
                </Badge>
              </div>
              <div className="absolute top-4 left-4">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    speak(flipped ? card.back : card.front)
                  }}
                  className="text-white hover:bg-white/20"
                  aria-label="Прослушать слово"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>

              <div className="text-center px-6">
                <div
                  className="text-5xl md:text-6xl font-bold mb-3"
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  {flipped ? card.back : card.front}
                </div>
                {!flipped && card.transcription && (
                  <div className="text-lg text-white/80 italic">
                    [{card.transcription}]
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm flex items-center gap-2">
                <RotateCw className="w-3 h-3" />
                Нажмите, чтобы перевернуть
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleFlip}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Перевернуть
            </Button>
            <Button
              onClick={handleKnown}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4" />
              Знаю
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            Вперёд
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
