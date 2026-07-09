'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BookOpen, CheckCircle2, GraduationCap, Lightbulb, Volume2 } from 'lucide-react'
import { Language, Lesson } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const levelColors: Record<string, string> = {
  'Начальный': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Средний': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Продвинутый': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export function LessonsSection({ language }: { language: Language }) {
  const { markLessonVisited, getLanguageProgress, recordActivity } = useProgressStore()
  const progress = getLanguageProgress(language.id)
  const isRtl = language.direction === 'rtl'

  const handleLessonClick = (lessonId: string) => {
    markLessonVisited(language.id, lessonId)
    recordActivity()
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Уроки {language.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {language.lessons.length} структурированных урока с лексикой и грамматикой
        </p>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>Изучено: {progress.visitedLessons.length} / {language.lessons.length}</span>
        </div>
      </Card>

      <Accordion type="single" collapsible className="space-y-3">
        {language.lessons.map((lesson, i) => {
          const isVisited = progress.visitedLessons.includes(lesson.id)
          return (
            <AccordionItem
              key={lesson.id}
              value={lesson.id}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger
                onClick={() => handleLessonClick(lesson.id)}
                className="hover:no-underline px-5 py-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-4 text-left flex-1">
                  <div className={cn(
                    'shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
                    `bg-gradient-to-br ${language.gradient}`
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{lesson.title}</span>
                      {isVisited && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {lesson.description}
                    </div>
                  </div>
                  <Badge
                    className={cn('shrink-0', levelColors[lesson.level])}
                    variant="secondary"
                  >
                    {lesson.level}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-2">
                <LessonContent lesson={lesson} isRtl={isRtl} languageId={language.id} />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

function LessonContent({
  lesson,
  isRtl,
  languageId,
}: {
  lesson: Lesson
  isRtl: boolean
  languageId: string
}) {
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.lang = languageId === 'russian' ? 'ru-RU'
        : languageId === 'chinese' ? 'zh-CN'
        : languageId === 'english' ? 'en-US'
        : languageId === 'greek' ? 'el-GR'
        : 'ru-RU'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="space-y-5">
      {/* Vocabulary */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h4 className="font-semibold">Словарь урока</h4>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lesson.vocabulary.map((word, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg border bg-card hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className="text-lg font-medium"
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  {word.word}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => speak(word.word)}
                  className="h-6 w-6 opacity-50 group-hover:opacity-100"
                >
                  <Volume2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground italic mb-1">
                [{word.transcription}]
              </div>
              <div className="text-sm">{word.translation}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Grammar note */}
      <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Грамматическая заметка</h4>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {lesson.grammarNote}
        </p>
      </div>
    </div>
  )
}
