'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Volume2, ArrowRight, Calendar } from 'lucide-react'
import { languages } from '@/lib/languages-data'

// Deterministic daily selection based on date
function getDailyIndex(max: number): number {
  const today = new Date()
  const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 50 + today.getDate()
  return seed % max
}

interface WordOfDay {
  languageId: string
  languageName: string
  languageEmoji: string
  gradient: string
  word: string
  transcription: string
  translation: string
  isRtl: boolean
  funFact: string
}

export function WordOfDay({ onOpenLanguage }: { onOpenLanguage: (id: string) => void }) {
  const wordOfDay = useMemo<WordOfDay | null>(() => {
    // Build pool of all phrases from all languages
    const pool: WordOfDay[] = []
    for (const lang of languages) {
      for (const phrase of lang.phrases) {
        pool.push({
          languageId: lang.id,
          languageName: lang.name,
          languageEmoji: lang.emoji,
          gradient: lang.gradient,
          word: phrase.original,
          transcription: phrase.transcription,
          translation: phrase.translation,
          isRtl: lang.direction === 'rtl',
          funFact: lang.culture[getDailyIndex(lang.culture.length)]?.title || '',
        })
      }
    }
    const idx = getDailyIndex(pool.length)
    return pool[idx] || null
  }, [])

  const speak = (text: string, langId: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.lang = langId === 'russian' ? 'ru-RU'
        : langId === 'chinese' ? 'zh-CN'
        : langId === 'english' ? 'en-US'
        : langId === 'greek' ? 'el-GR'
        : 'ru-RU'
      window.speechSynthesis.speak(utterance)
    }
  }

  if (!wordOfDay) return null

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden border-2">
        <div className={`bg-gradient-to-br ${wordOfDay.gradient} p-1`}>
          <div className="bg-card rounded-t-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Слово дня
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{today}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {wordOfDay.languageEmoji} {wordOfDay.languageName}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div
                  className="text-4xl font-bold mb-2"
                  dir={wordOfDay.isRtl ? 'rtl' : 'ltr'}
                >
                  {wordOfDay.word}
                </div>
                <div className="text-sm text-muted-foreground italic mb-2">
                  /{wordOfDay.transcription}/
                </div>
                <div className="text-lg font-medium border-t pt-2">
                  {wordOfDay.translation}
                </div>
                {wordOfDay.funFact && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                    <span>{wordOfDay.funFact}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => speak(wordOfDay.word, wordOfDay.languageId)}
                  className="h-10 w-10"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="default"
                  onClick={() => onOpenLanguage(wordOfDay.languageId)}
                  className="h-10 w-10"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
