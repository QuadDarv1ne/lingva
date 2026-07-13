'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, MessageSquare } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { speak as speakText } from '@/lib/utils'

export function PhrasesSection({ language }: { language: Language }) {
  const isRtl = language.direction === 'rtl'

  const speak = (text: string) => speakText(text, language.id)

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Ключевые фразы</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {language.phrases.length} полезных выражений с транскрипцией и переводом. Нажмите на динамик, чтобы услышать произношение.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {language.phrases.map((phrase, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-2xl font-medium mb-1 truncate"
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    {phrase.original}
                  </div>
                  <div className="text-sm text-muted-foreground italic mb-2">
                    [{phrase.transcription}]
                  </div>
                  <div className="text-sm font-medium border-t pt-2 mt-2">
                    {phrase.translation}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => speak(phrase.original)}
                  className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                  aria-label="Прослушать фразу"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
