'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  History, Search, Type, BookOpen, Trophy, Layers, Brush,
  Keyboard, Link2, Bot, Star, Plus, Target, ShoppingBag,
  Users, Swords, Zap, Loader2, Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { useProgressStore, ActivityEvent } from '@/lib/store'
import { languages } from '@/lib/languages-data'
import { cn } from '@/lib/utils'

const eventConfig: Record<string, { icon: typeof Type; color: string; label: string }> = {
  letter_learned: { icon: Type, color: 'text-rose-500', label: 'Буква изучена' },
  lesson_visited: { icon: BookOpen, color: 'text-amber-500', label: 'Урок пройден' },
  quiz_completed: { icon: Trophy, color: 'text-amber-500', label: 'Тест завершён' },
  flashcard_studied: { icon: Layers, color: 'text-emerald-500', label: 'Карточка' },
  word_matched: { icon: Link2, color: 'text-blue-500', label: 'Пара сопоставлена' },
  character_written: { icon: Brush, color: 'text-purple-500', label: 'Символ написан' },
  chat_message: { icon: Bot, color: 'text-teal-500', label: 'Сообщение ИИ' },
  word_typed: { icon: Keyboard, color: 'text-pink-500', label: 'Слово напечатано' },
  achievement_unlocked: { icon: Star, color: 'text-amber-500', label: 'Достижение' },
  word_added: { icon: Plus, color: 'text-emerald-500', label: 'Слово добавлено' },
  daily_challenge: { icon: Target, color: 'text-orange-500', label: 'Daily challenge' },
  shop_purchase: { icon: ShoppingBag, color: 'text-amber-500', label: 'Покупка' },
  friend_added: { icon: Users, color: 'text-blue-500', label: 'Новый друг' },
  tournament_joined: { icon: Swords, color: 'text-amber-500', label: 'Турнир' },
  level_up: { icon: Zap, color: 'text-amber-500', label: 'Новый уровень' },
}

export default function HistoryPage() {
  const { activityEvents } = useProgressStore()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const filteredEvents = useMemo(() => {
    return activityEvents.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false
      if (search) {
        const q = search.toLowerCase()
        return e.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [activityEvents, search, filterType])

  // Group by date
  const grouped = useMemo(() => {
    const map: { [date: string]: ActivityEvent[] } = {}
    filteredEvents.forEach((e) => {
      const date = new Date(e.timestamp).toISOString().split('T')[0]
      if (!map[date]) map[date] = []
      map[date].push(e)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredEvents])

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const todayEvents = activityEvents.filter((e) =>
    e.timestamp.startsWith(today)
  )
  const todayXP = todayEvents.reduce((s, e) => s + Math.max(0, e.xpGained), 0)
  const totalXP = activityEvents.reduce((s, e) => s + Math.max(0, e.xpGained), 0)

  const availableTypes = Array.from(new Set(activityEvents.map((e) => e.type)))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">История</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Все ваши действия
              </div>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Назад</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{activityEvents.length}</div>
            <div className="text-xs text-muted-foreground">всего событий</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{todayEvents.length}</div>
            <div className="text-xs text-muted-foreground">сегодня</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">+{todayXP}</div>
            <div className="text-xs text-muted-foreground">XP сегодня</div>
          </Card>
        </div>

        {/* Search and filter */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по истории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                Все
              </Button>
              {availableTypes.map((type) => {
                const config = eventConfig[type]
                if (!config) return null
                const Icon = config.icon
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant={filterType === type ? 'default' : 'outline'}
                    onClick={() => setFilterType(type)}
                    className="flex items-center gap-1"
                  >
                    <Icon className={cn('w-3 h-3', filterType === type ? 'text-white' : config.color)} />
                    {config.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Timeline */}
        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">
              {activityEvents.length === 0 ? 'История пуста' : 'Ничего не найдено'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activityEvents.length === 0
                ? 'Начните изучать языки, и здесь появится история ваших действий'
                : 'Попробуйте изменить фильтр или поиск'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, events]) => {
              const dateObj = new Date(date)
              const isToday = date === today
              const isYesterday = date === new Date(Date.now() - 86400000).toISOString().split('T')[0]
              const dateLabel = isToday
                ? 'Сегодня'
                : isYesterday
                ? 'Вчера'
                : dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3 sticky top-[60px] bg-background/80 backdrop-blur-sm py-2 z-10">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{dateLabel}</h3>
                    <Badge variant="secondary" className="text-xs">{events.length}</Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2">
                    {events.map((event, i) => {
                      const config = eventConfig[event.type] || eventConfig.letter_learned
                      const Icon = config.icon
                      const lang = event.languageId
                        ? languages.find((l) => l.id === event.languageId)
                        : null
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        >
                          <Card className="p-3 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                              <div className={cn('shrink-0', config.color)}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {event.description}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>{config.label}</span>
                                  {lang && (
                                    <>
                                      <span>·</span>
                                      <span>{lang.emoji} {lang.name}</span>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span>
                                    {new Date(event.timestamp).toLocaleTimeString('ru-RU', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                              {event.xpGained !== 0 && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs shrink-0',
                                    event.xpGained > 0
                                      ? 'text-emerald-600 border-emerald-300'
                                      : 'text-rose-600 border-rose-300'
                                  )}
                                >
                                  {event.xpGained > 0 ? '+' : ''}{event.xpGained} XP
                                </Badge>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
