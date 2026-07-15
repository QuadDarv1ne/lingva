'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Globe, BookOpen, Calendar, Languages as LangIcon, History } from 'lucide-react'
import { Language } from '@/lib/languages-data'

export function OverviewSection({ language }: { language: Language }) {
  const stats = [
    { icon: Users, label: 'Носителей', value: language.speakers },
    { icon: BookOpen, label: 'Письменность', value: language.script },
    { icon: LangIcon, label: 'Семья', value: language.family },
    { icon: Calendar, label: 'Эпоха', value: language.era },
    { icon: Globe, label: 'Направление', value: language.direction === 'rtl' ? 'Справа налево' : 'Слева направо' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${language.gradient} p-8 text-white`}
      >
        <div className="absolute -right-8 -top-8 text-[12rem] leading-none opacity-20">
          {language.emoji}
        </div>
        <div className="relative z-10 space-y-3">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {language.nativeName}
          </h2>
          <p className="text-xl text-white/90 font-light italic">
            {language.tagline}
          </p>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">О языке</h3>
          <p className="text-foreground/80 leading-relaxed">
            {language.longDescription}
          </p>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </div>
              <div className="text-sm font-medium leading-tight">{stat.value}</div>
            </Card>
          )
        })}
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">История языка</h3>
          </div>
          <div className="space-y-4">
            {language.history.map((event, i) => (
              <div key={event} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
                  {i < language.history.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Quick info badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap gap-2"
      >
        <Badge variant="secondary">{language.alphabet.length} символов в алфавите</Badge>
        <Badge variant="secondary">{language.phrases.length} ключевых фраз</Badge>
        <Badge variant="secondary">{language.lessons.length} уроков</Badge>
        <Badge variant="secondary">{language.quiz.length} тестовых вопросов</Badge>
      </motion.div>
    </div>
  )
}
