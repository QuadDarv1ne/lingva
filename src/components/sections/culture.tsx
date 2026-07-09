'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, BookHeart } from 'lucide-react'
import { Language } from '@/lib/languages-data'

export function CultureSection({ language }: { language: Language }) {
  const isRtl = language.direction === 'rtl'

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Культура и факты</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Интересные факты о {language.name} языке и культуре его носителей
        </p>
      </Card>

      {/* Cultural facts grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {language.culture.map((fact, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-5 h-full hover:shadow-md transition-shadow border-l-4 border-l-primary/40">
              <div className="flex items-start gap-3">
                <div className="text-3xl shrink-0">{fact.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{fact.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fact.content}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Proverbs */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookHeart className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Пословицы и поговорки</h3>
        </div>
        <div className="space-y-3">
          {language.proverbs.map((proverb, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-lg bg-muted/40 border-l-4 border-l-primary/60"
            >
              <div
                className="text-xl font-medium mb-2 leading-relaxed"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {proverb.original}
              </div>
              <div className="text-sm italic text-muted-foreground mb-1">
                {proverb.translation}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  Смысл
                </Badge>
                <span className="text-sm">{proverb.meaning}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
