'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Heart, Languages as LangIcon, TrendingUp, RotateCcw, Filter, Trophy, Zap, Users, BarChart3, Swords, Layers, ShoppingBag, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { languages } from '@/lib/languages-data'
import { LanguageCard } from '@/components/language-card'
import { LanguageDetail } from '@/components/language-detail'
import { AchievementsPanel } from '@/components/achievements-panel'
import { XPDailyPanel } from '@/components/xp-daily-panel'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthButtons } from '@/components/auth-buttons'
import { NotificationBell } from '@/components/notification-bell'
import { GlobalSearch } from '@/components/global-search'
import { WordOfDay } from '@/components/word-of-day'
import { Onboarding } from '@/components/onboarding'
import { useProgressStore, getLevelFromXP, getLevelTitle } from '@/lib/store'
import { useProgressSync } from '@/hooks/use-progress-sync'
import { useAuthContext } from '@/hooks/auth-context'

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showXPDaily, setShowXPDaily] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const { user: authUser } = useAuthContext()
  const {
    favorites,
    resetProgress,
    progress,
    achievements,
    recordActivity,
    checkAchievements,
    generateDailyChallenges,
    xp,
  } = useProgressStore()

  // Sync progress with server when logged in
  useProgressSync(!!authUser)

  // Record activity once on mount (daily streak) + generate daily challenges
  useEffect(() => {
    recordActivity()
    generateDailyChallenges()
    checkAchievements()
  }, [recordActivity, checkAchievements, generateDailyChallenges])

  const filteredLanguages = useMemo(() => {
    return languages.filter((lang) => {
      if (showFavoritesOnly && !favorites.includes(lang.id)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          lang.name.toLowerCase().includes(q) ||
          lang.nativeName.toLowerCase().includes(q) ||
          lang.description.toLowerCase().includes(q) ||
          lang.family.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, showFavoritesOnly, favorites])

  const selectedLanguage = selectedId
    ? languages.find((l) => l.id === selectedId)
    : null

  // Calculate overall stats
  const totalLearnedLetters = Object.values(progress).reduce(
    (sum, p) => sum + (p.learnedLetters?.length || 0),
    0
  )
  const totalVisitedLessons = Object.values(progress).reduce(
    (sum, p) => sum + (p.visitedLessons?.length || 0),
    0
  )
  const totalFlashcards = Object.values(progress).reduce(
    (sum, p) => sum + (p.flashcardsStudied || 0),
    0
  )
  const totalMatched = Object.values(progress).reduce(
    (sum, p) => sum + (p.matchedWords || 0),
    0
  )
  const totalWritten = Object.values(progress).reduce(
    (sum, p) => sum + (p.writtenCharacters || 0),
    0
  )
  const totalQuizzes = Object.values(progress).reduce(
    (sum, p) => sum + Object.keys(p.completedQuizzes || {}).length,
    0
  )
  const totalChat = Object.values(progress).reduce(
    (sum, p) => sum + (p.chatMessages || 0),
    0
  )
  const totalTyped = Object.values(progress).reduce(
    (sum, p) => sum + (p.typedCorrectly || 0),
    0
  )

  if (selectedLanguage) {
    return (
      <LanguageDetail
        language={selectedLanguage}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/30">
      <Onboarding />
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white">
              <LangIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Лингва</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                7 языков · 1 платформа
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="hidden md:block w-64">
              <GlobalSearch />
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
              {languages.length} языков
            </Badge>
            {/* Community links */}
            {authUser && (
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="Аналитика">
                  <a href="/dashboard">
                    <BarChart3 className="w-4 h-4" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="Магазин">
                  <a href="/dashboard/shop">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="История">
                  <a href="/dashboard/history">
                    <History className="w-4 h-4" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="Мои колоды">
                  <a href="/dashboard/decks">
                    <Layers className="w-4 h-4" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="Турниры">
                  <a href="/community/tournaments">
                    <Swords className="w-4 h-4 text-amber-500" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="Друзья">
                  <a href="/community/friends">
                    <Users className="w-4 h-4" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="w-9 h-9" title="Лидерборд">
                  <a href="/community/leaderboard">
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </a>
                </Button>
                <NotificationBell />
              </div>
            )}
            {/* XP badge - always visible when xp > 0 */}
            {xp > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowXPDaily((s) => !s)}
                className="flex items-center gap-2"
                title={`Уровень ${getLevelFromXP(xp).level} · ${getLevelTitle(getLevelFromXP(xp).level)}`}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {xp.toLocaleString('ru-RU')}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 hidden md:inline">
                  ур. {getLevelFromXP(xp).level}
                </Badge>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAchievements((s) => !s)}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Достижения</span>
              {achievements.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                  {achievements.length}
                </Badge>
              )}
            </Button>
            <ThemeToggle />
            <AuthButtons />
            {(totalLearnedLetters > 0 || totalVisitedLessons > 0) && (
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Сбросить прогресс"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Сброс прогресса</AlertDialogTitle>
                    <AlertDialogDescription>
                      Сбросить весь прогресс изучения? Это действие необратимо.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { resetProgress(); setShowResetDialog(false) }}>
                      Сбросить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent" />
        <div className="absolute -top-20 -right-20 text-[20rem] opacity-5 select-none pointer-events-none">
          🌍
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              Бесплатная платформа изучения языков
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
              Изучайте языки мира —{' '}
              <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                от древних до современных
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Семь языков в одной платформе: от современного русского и английского
              до древнего арамейского и церковнославянского. Алфавиты, фразы, уроки,
              флеш-карты, практика письма, игры и тесты — всё для систематического изучения.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-3xl font-bold text-primary">{languages.length}</div>
                <div className="text-sm text-muted-foreground">языков</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {languages.reduce((s, l) => s + l.lessons.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">уроков</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {languages.reduce((s, l) => s + l.alphabet.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">символов</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {languages.reduce((s, l) => s + l.phrases.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">фраз</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {languages.reduce((s, l) => s + l.culture.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">фактов</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Achievements panel (collapsible) */}
      {showAchievements && (
        <section className="container mx-auto max-w-6xl px-4 pb-2">
          <AchievementsPanel />
        </section>
      )}

      {/* XP & Daily Challenges panel (collapsible) */}
      {showXPDaily && (
        <section className="container mx-auto max-w-6xl px-4 pb-2">
          <XPDailyPanel />
        </section>
      )}

      {/* Your progress (if any) */}
      {(totalLearnedLetters > 0 || totalVisitedLessons > 0 || totalFlashcards > 0 || totalMatched > 0 || totalWritten > 0 || totalChat > 0) && (
        <section className="container mx-auto max-w-6xl px-4 pb-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Ваш прогресс</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalLearnedLetters}</div>
                <div className="text-xs text-muted-foreground">букв</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalVisitedLessons}</div>
                <div className="text-xs text-muted-foreground">уроков</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalFlashcards}</div>
                <div className="text-xs text-muted-foreground">карточек</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalMatched}</div>
                <div className="text-xs text-muted-foreground">пар</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalWritten}</div>
                <div className="text-xs text-muted-foreground">символов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalTyped}</div>
                <div className="text-xs text-muted-foreground">напечатано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalChat}</div>
                <div className="text-xs text-muted-foreground">сообщений</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalQuizzes}</div>
                <div className="text-xs text-muted-foreground">тестов</div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Word of the Day */}
      <section className="container mx-auto max-w-6xl px-4 pb-2">
        <WordOfDay onOpenLanguage={(id) => setSelectedId(id)} />
      </section>

      {/* Filters */}
      <section className="container mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Поиск языка..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            onClick={() => setShowFavoritesOnly((v) => !v)}
            className="flex items-center gap-2"
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Избранные ({favorites.length})
          </Button>
          {(search || showFavoritesOnly) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('')
                setShowFavoritesOnly(false)
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Сбросить
            </Button>
          )}
        </div>

        {/* Language grid */}
        {filteredLanguages.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {showFavoritesOnly
                ? 'У вас пока нет избранных языков. Нажмите на сердечко, чтобы добавить.'
                : 'Языки не найдены по вашему запросу.'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredLanguages.map((lang, i) => (
              <LanguageCard
                key={lang.id}
                language={lang}
                index={i}
                onOpen={() => setSelectedId(lang.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white">
                <LangIcon className="w-3.5 h-3.5" />
              </div>
              <span>Лингва · Изучение языков</span>
            </div>
            <div>
              {languages.length} языков · {' '}
              {languages.reduce((s, l) => s + l.lessons.length, 0)} уроков · {' '}
              {languages.reduce((s, l) => s + l.alphabet.length, 0)} символов
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
