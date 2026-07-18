'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, BookOpen, Users, Globe, ArrowRight } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface LanguageCardProps {
  language: Language
  onOpen: () => void
  index: number
}

export function LanguageCard({ language, onOpen, index }: LanguageCardProps) {
  const { favorites, toggleFavorite, getLanguageProgress, recordActivity } = useProgressStore()
  const isFavorite = favorites.includes(language.id)
  const progress = getLanguageProgress(language.id)
  const totalLessons = language.lessons.length
  const visitedLessons = progress.visitedLessons.length
  const totalLetters = language.alphabet.length
  const learnedLetters = progress.learnedLetters.length
  const progressPct = totalLessons > 0
    ? Math.round((visitedLessons / totalLessons) * 100)
    : 0

  const handleOpen = () => {
    recordActivity()
    onOpen()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Card
        className="group relative overflow-hidden h-full flex flex-col cursor-pointer border-2 hover:border-primary/40 transition-all"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } }}
      >
        {/* Gradient header */}
        <div className={cn('h-32 bg-gradient-to-br relative overflow-hidden', language.gradient)}>
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <div className="absolute -right-4 -top-4 text-[8rem] leading-none opacity-50">
              {language.emoji}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-between p-5">
            <div>
              <div className="text-3xl font-bold text-white drop-shadow-lg tracking-tight">
                {language.nativeName}
              </div>
              <div className="text-white/80 text-sm mt-1 font-medium">
                {language.name}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(language.id)
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors backdrop-blur-sm"
              aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <Heart
                className={cn(
                  'w-5 h-5 text-white transition-all',
                  isFavorite && 'fill-white'
                )}
              />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          <p className="text-sm text-muted-foreground italic">
            «{language.tagline}»
          </p>
          <p className="text-sm text-foreground/80 line-clamp-3 flex-1">
            {language.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{language.speakers}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate">{language.script}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language.alphabet.length} букв · {language.lessons.length} уроков</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[10px] uppercase tracking-wide">{language.era}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full bg-gradient-to-r', language.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-2 mt-auto">
            <Badge variant="outline" className="text-xs">
              {learnedLetters}/{totalLetters} букв
            </Badge>
            <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Изучать
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
