'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, Check, RotateCcw, Trophy } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface MatchPair {
  id: string
  word: string
  translation: string
  transcription?: string
}

interface WordTileProps {
  pair: MatchPair
  isRtl: boolean
  matched: boolean
}

function WordTile({ pair, isRtl, matched }: WordTileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `word-${pair.id}`,
    disabled: matched,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'px-4 py-3 rounded-lg border-2 font-medium text-center cursor-grab active:cursor-grabbing transition-all select-none',
        matched
          ? 'opacity-40 cursor-default border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
          : isDragging
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-border bg-card hover:border-primary/50'
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="text-lg">{pair.word}</div>
      {pair.transcription && (
        <div className="text-[10px] text-muted-foreground italic mt-0.5">
          [{pair.transcription}]
        </div>
      )}
    </div>
  )
}

interface TranslationSlotProps {
  pair: MatchPair
  matchedId: string | null
  isCorrect: boolean | null
}

function TranslationSlot({ pair, matchedId, isCorrect }: TranslationSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${pair.id}` })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'px-4 py-3 rounded-lg border-2 border-dashed text-center min-h-[60px] flex items-center justify-center transition-all',
        isOver && !matchedId
          ? 'border-primary bg-primary/5 scale-105'
          : isCorrect === true
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
          : isCorrect === false
          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
          : 'border-border'
      )}
    >
      {matchedId ? (
        <div className="flex items-center gap-2">
          <span className="font-medium">{pair.translation}</span>
          {isCorrect === true && <Check className="w-4 h-4 text-emerald-500" />}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{pair.translation}</span>
      )}
    </div>
  )
}

export function MatchingGame({ language }: { language: Language }) {
  const { incrementMatchedWords, recordActivity, updateDailyChallenge } = useProgressStore()
  const isRtl = language.direction === 'rtl'

  // Generate 6 pairs from vocabulary
  const pairs: MatchPair[] = useMemo(() => {
    const candidates: MatchPair[] = []
    language.lessons.forEach((lesson) => {
      lesson.vocabulary.forEach((v) => {
        candidates.push({
          id: `${lesson.id}-${v.word}`,
          word: v.word,
          translation: v.translation,
          transcription: v.transcription,
        })
      })
    })
    language.phrases.forEach((p, i) => {
      candidates.push({
        id: `phrase-${i}`,
        word: p.original,
        translation: p.translation,
        transcription: p.transcription,
      })
    })
    // shuffle and take 6
    return candidates.sort(() => Math.random() - 0.5).slice(0, 6)
  }, [language])

  const [shuffledWords, setShuffledWords] = useState<MatchPair[]>([])
  const [matches, setMatches] = useState<{ [wordId: string]: string }>({})
  const [feedback, setFeedback] = useState<{ [slotId: string]: boolean | null }>({})
  const [completed, setCompleted] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const timers = resetTimerRef.current
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShuffledWords([...pairs].sort(() => Math.random() - 0.5))
      setMatches({})
      setFeedback({})
      setCompleted(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [pairs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return

    const wordId = String(active.id).replace('word-', '')
    const slotId = String(over.id).replace('slot-', '')

    const isCorrect = wordId === slotId

    setMatches((prev) => ({ ...prev, [wordId]: slotId }))
    setFeedback((prev) => ({ ...prev, [slotId]: isCorrect }))

    if (isCorrect) {
      incrementMatchedWords(language.id, 1)
      recordActivity()
      updateDailyChallenge('matching', 1)
      // Check if all are matched
      const newMatches = { ...matches, [wordId]: slotId }
      const correctCount = Object.entries(newMatches).filter(
        ([wid, sid]) => wid === sid
      ).length
      if (correctCount === pairs.length) {
        const t = setTimeout(() => setCompleted(true), 500)
        resetTimerRef.current.push(t)
      }
    } else {
      // Reset after delay
      const t = setTimeout(() => {
        setMatches((prev) => {
          const next = { ...prev }
          delete next[wordId]
          return next
        })
        setFeedback((prev) => ({ ...prev, [slotId]: null }))
      }, 800)
      resetTimerRef.current.push(t)
    }
  }

  const handleRestart = () => {
    setShuffledWords([...pairs].sort(() => Math.random() - 0.5))
    setMatches({})
    setFeedback({})
    setCompleted(false)
  }

  const matchedCount = Object.entries(matches).filter(
    ([wid, sid]) => wid === sid
  ).length

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Сопоставь пары</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Перетащите слово к его переводу. Найдено пар: {matchedCount} / {pairs.length}
            </p>
          </div>
          <Button variant="outline" onClick={handleRestart} size="sm" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Заново
          </Button>
        </div>
      </Card>

      {completed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center max-w-md mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-300 dark:border-emerald-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto mb-4 flex items-center justify-center text-white">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Отлично!</h3>
            <p className="text-muted-foreground mb-4">
              Вы сопоставили все {pairs.length} пар правильно!
            </p>
            <Button onClick={handleRestart} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Играть снова
            </Button>
          </Card>
        </motion.div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Words column */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {language.name} — слова
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {shuffledWords.map((pair) => (
                    <motion.div
                      key={pair.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <WordTile
                        pair={pair}
                        isRtl={isRtl}
                        matched={!!matches[pair.id] && matches[pair.id] === pair.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Translations column */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Перевод
              </div>
              <div className="space-y-2">
                {pairs.map((pair) => (
                  <TranslationSlot
                    key={pair.id}
                    pair={pair}
                    matchedId={
                      Object.entries(matches).find(
                        ([wid, sid]) => sid === pair.id && wid === pair.id
                      )?.[0] || null
                    }
                    isCorrect={feedback[pair.id] ?? null}
                  />
                ))}
              </div>
            </div>
          </div>
        </DndContext>
      )}
    </div>
  )
}
