'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Flame, Star, Zap, Target, Award, Calendar,
  BookOpen, Type, Layers, Brush, Keyboard, Link2, Bot, Trophy,
  Download, Upload, Loader2, BarChart3, PieChart as PieIcon, Activity, Brain,
} from 'lucide-react'
import Link from 'next/link'
import { useProgressStore, getLevelFromXP } from '@/lib/store'
import { languages } from '@/lib/languages-data'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const ACTIVITY_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export default function DashboardPage() {
  const {
    progress, xp, xpHistory, streak, achievements,
    activityLog, personalDictionary, settings,
    exportData, importData, updateSettings,
  } = useProgressStore()
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)

  const { level } = getLevelFromXP(xp)

  // Last 30 days XP data
  const last30Days = useMemo(() => {
    const days: { date: string; day: number; weekday: string; xp: number; activity: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days.push({
        date: key,
        day: d.getDate(),
        weekday: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        xp: xpHistory[key] || 0,
        activity: activityLog[key] || 0,
      })
    }
    return days
  }, [xpHistory, activityLog])

  // XP per language breakdown
  const languageStats = useMemo(() => {
    return languages.map((lang, i) => {
      const p = progress[lang.id]
      if (!p) return { name: lang.name, shortName: lang.nativeName, xp: 0, color: ACTIVITY_COLORS[i % ACTIVITY_COLORS.length] }
      // Approximate XP per language based on activities
      const letterXP = p.learnedLetters.length * 5
      const lessonXP = p.visitedLessons.length * 15
      const flashXP = p.flashcardsStudied * 3 + p.flashcardsKnown * 8
      const matchXP = p.matchedWords * 6
      const writeXP = p.writtenCharacters * 12
      const chatXP = p.chatMessages * 5
      const typeXP = p.typedCorrectly * 4
      const quizXP = Object.values(p.completedQuizzes).reduce((s, v) => s + v, 0) * 5
      return {
        name: lang.name,
        shortName: lang.nativeName,
        xp: letterXP + lessonXP + flashXP + matchXP + writeXP + chatXP + typeXP + quizXP,
        color: ACTIVITY_COLORS[i % ACTIVITY_COLORS.length],
        letters: p.learnedLetters.length,
        lessons: p.visitedLessons.length,
        flashcards: p.flashcardsStudied,
      }
    }).filter((l) => l.xp > 0)
  }, [progress])

  // Activity type breakdown
  const activityBreakdown = useMemo(() => {
    const data = [
      { name: 'Буквы', value: 0, icon: Type, color: '#f43f5e' },
      { name: 'Уроки', value: 0, icon: BookOpen, color: '#f59e0b' },
      { name: 'Карточки', value: 0, icon: Layers, color: '#10b981' },
      { name: 'Игра', value: 0, icon: Link2, color: '#3b82f6' },
      { name: 'Письмо', value: 0, icon: Brush, color: '#8b5cf6' },
      { name: 'Печать', value: 0, icon: Keyboard, color: '#ec4899' },
      { name: 'Чат', value: 0, icon: Bot, color: '#14b8a6' },
    ]
    Object.values(progress).forEach((p) => {
      data[0].value += p.learnedLetters.length
      data[1].value += p.visitedLessons.length
      data[2].value += p.flashcardsStudied
      data[3].value += p.matchedWords
      data[4].value += p.writtenCharacters
      data[5].value += p.typedCorrectly
      data[6].value += p.chatMessages
    })
    return data.filter((d) => d.value > 0)
  }, [progress])

  // Activity heatmap (last 365 days)
  const heatmapData = useMemo(() => {
    const days: { date: string; count: number; day: number }[] = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const count = activityLog[key] || 0
      days.push({ date: key, count, day: d.getDay() })
    }
    return days
  }, [activityLog])

  // Stats summary
  const todayXP = xpHistory[new Date().toISOString().split('T')[0]] || 0
  const dailyGoalProgress = Math.min(100, Math.round((todayXP / settings.dailyGoalXP) * 100))

  // Export handler
  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lingva-progress-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Прогресс экспортирован ✅' })
  }

  // Import handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string
        const success = importData(json)
        if (success) {
          toast({ title: 'Прогресс импортирован ✅' })
        } else {
          toast({ title: 'Ошибка импорта', description: 'Некорректный файл', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Ошибка импорта', variant: 'destructive' })
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Аналитика</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Ваш прогресс
              </div>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">← На главную</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <Badge variant="outline" className="text-xs">Ур. {level}</Badge>
            </div>
            <div className="text-2xl font-bold">{xp.toLocaleString('ru-RU')}</div>
            <div className="text-xs text-muted-foreground">всего XP</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <Badge variant="outline" className="text-xs">макс: {streak.longest}</Badge>
            </div>
            <div className="text-2xl font-bold">{streak.current}</div>
            <div className="text-xs text-muted-foreground">дней стрик</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <Badge variant="outline" className="text-xs">из 21</Badge>
            </div>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <div className="text-xs text-muted-foreground">достижений</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-xs">{todayXP}/{settings.dailyGoalXP}</Badge>
            </div>
            <div className="text-2xl font-bold">{dailyGoalProgress}%</div>
            <div className="text-xs text-muted-foreground">цель дня</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${dailyGoalProgress}%` }}
              />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="charts">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Графики</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Календарь</span>
            </TabsTrigger>
            <TabsTrigger value="languages" className="flex items-center gap-2">
              <PieIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Языки</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          {/* Charts tab */}
          <TabsContent value="charts" className="mt-6 space-y-6">
            {/* XP over time */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    XP за последние 30 дней
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Всего за период: {last30Days.reduce((s, d) => s + d.xp, 0)} XP
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item ? `${item.weekday}, ${item.date}` : label
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xp"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Activity bar chart */}
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                Активность за 30 дней (количество действий)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="activity" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Activity types pie */}
            {activityBreakdown.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <PieIcon className="w-4 h-4 text-primary" />
                  Распределение активности
                </h3>
                <div className="grid md:grid-cols-2 gap-4 items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={activityBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        labelLine={false}
                      >
                        {activityBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {activityBreakdown.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: a.color }}
                        />
                        <span className="flex-1 text-sm">{a.name}</span>
                        <span className="font-bold">{a.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Heatmap tab */}
          <TabsContent value="heatmap" className="mt-6">
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                Календарь активности за год
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Каждый квадрат — день. Чем темнее зелёный, тем больше активности.
              </p>
              <div className="overflow-x-auto">
                <div className="inline-grid grid-flow-col grid-rows-7 gap-1">
                  {heatmapData.map((day, i) => {
                    const intensity = day.count === 0 ? 0
                      : day.count < 5 ? 1
                      : day.count < 15 ? 2
                      : day.count < 30 ? 3
                      : 4
                    const colors = [
                      'bg-muted/50',
                      'bg-emerald-200 dark:bg-emerald-900',
                      'bg-emerald-400 dark:bg-emerald-700',
                      'bg-emerald-500 dark:bg-emerald-600',
                      'bg-emerald-600 dark:bg-emerald-500',
                    ]
                    return (
                      <div
                        key={i}
                        className={cn('w-3 h-3 rounded-sm', colors[intensity])}
                        title={`${day.date}: ${day.count} действий`}
                      />
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Меньше</span>
                <div className="w-3 h-3 rounded-sm bg-muted/50" />
                <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
                <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                <span>Больше</span>
              </div>
            </Card>
          </TabsContent>

          {/* Languages tab */}
          <TabsContent value="languages" className="mt-6 space-y-4">
            {languageStats.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">Нет данных по языкам</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Начните изучать языки, чтобы увидеть статистику
                </p>
                <Link href="/">
                  <Button>Начать изучение</Button>
                </Link>
              </Card>
            ) : (
              <>
                <Card className="p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <PieIcon className="w-4 h-4 text-primary" />
                    XP по языкам
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={languageStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="xp" radius={[0, 4, 4, 0]}>
                        {languageStats.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid sm:grid-cols-2 gap-4">
                  {languageStats.map((lang, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: lang.color }}
                          />
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-xs text-muted-foreground">— {lang.shortName}</span>
                          <Badge variant="outline" className="ml-auto">
                            {lang.xp} XP
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="font-bold">{lang.letters}</div>
                            <div className="text-muted-foreground">букв</div>
                          </div>
                          <div>
                            <div className="font-bold">{lang.lessons}</div>
                            <div className="text-muted-foreground">уроков</div>
                          </div>
                          <div>
                            <div className="font-bold">{lang.flashcards}</div>
                            <div className="text-muted-foreground">карточек</div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            {/* Daily goal */}
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                Ежедневная цель по XP
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((goal) => (
                  <Button
                    key={goal}
                    variant={settings.dailyGoalXP === goal ? 'default' : 'outline'}
                    onClick={() => updateSettings({ dailyGoalXP: goal })}
                  >
                    {goal} XP
                  </Button>
                ))}
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                Предпочтения
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Звуковые эффекты</div>
                    <div className="text-xs text-muted-foreground">Озвучка слов и букв</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Авто-произношение</div>
                    <div className="text-xs text-muted-foreground">Автоматически озвучивать при клике</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => updateSettings({ autoSpeak: e.target.checked })}
                    className="w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Уменьшить анимации</div>
                    <div className="text-xs text-muted-foreground">Для устройств с низкой производительностью</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
                    className="w-4 h-4"
                  />
                </label>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-primary" />
                Уведомления
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Заявки в друзья</div>
                    <div className="text-xs text-muted-foreground">Когда кто-то добавляет вас</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.friendRequests}
                    onChange={(e) => updateSettings({ notifications: { friendRequests: e.target.checked } })}
                    className="w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Достижения</div>
                    <div className="text-xs text-muted-foreground">При разблокировке новых наград</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.achievements}
                    onChange={(e) => updateSettings({ notifications: { achievements: e.target.checked } })}
                    className="w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Ежедневные напоминания</div>
                    <div className="text-xs text-muted-foreground">Не забывать о стрике</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyReminders}
                    onChange={(e) => updateSettings({ notifications: { dailyReminders: e.target.checked } })}
                    className="w-4 h-4"
                  />
                </label>
              </div>
            </Card>

            {/* Export/Import */}
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Download className="w-4 h-4 text-primary" />
                Экспорт и импорт данных
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Экспорт прогресса
                </Button>
                <label className="cursor-pointer">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 w-full pointer-events-none"
                    disabled={importing}
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Импорт из файла
                  </Button>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Экспорт сохранит весь ваш прогресс, достижения и словарик в JSON-файл.
                Импорт заменит текущие данные.
              </p>
            </Card>

            {/* Personal dictionary summary */}
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-primary" />
                Личный словарик
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">{personalDictionary.length}</div>
                  <div className="text-xs text-muted-foreground">сохранённых слов</div>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/practice">
                    <Button variant="outline" size="sm">
                      <Brain className="w-4 h-4 mr-1" />
                      Практика SRS
                    </Button>
                  </Link>
                  <Link href="/dashboard/dictionary">
                    <Button variant="outline" size="sm">
                      Открыть словарик
                    </Button>
                  </Link>
                </div>
              </div>
              {/* Due today indicator */}
              {(() => {
                const now = new Date()
                const dueCount = personalDictionary.filter((w) => {
                  if (!w.srs) return true
                  return new Date(w.srs.dueDate) <= now
                }).length
                if (dueCount > 0) {
                  return (
                    <div className="mt-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-sm">
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="text-purple-900 dark:text-purple-200">
                          <strong>{dueCount}</strong> {dueCount === 1 ? 'карточка' : 'карточек'} ожидают повторения
                        </span>
                        <Link href="/dashboard/practice" className="ml-auto text-purple-600 hover:underline text-xs font-medium">
                          Повторить →
                        </Link>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
