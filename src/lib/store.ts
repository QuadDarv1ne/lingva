// Zustand store для отслеживания прогресса изучения языков
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLevelFromXP } from './level'

export interface LanguageProgress {
  visitedLessons: string[]
  completedQuizzes: { [quizId: string]: number } // quizId -> best score %
  learnedLetters: string[]
  flashcardsStudied: number
  flashcardsKnown: number
  matchedWords: number
  writtenCharacters: number
  chatMessages: number
  typedCorrectly: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  xpReward: number
  type: 'letters' | 'flashcards' | 'quiz' | 'writing' | 'matching' | 'chat'
  target: number
  date: string // YYYY-MM-DD
  progress: number
  completed: boolean
}

// XP per action
export const XP_REWARDS = {
  letterLearned: 5,
  lessonVisited: 15,
  flashcardStudied: 3,
  flashcardKnown: 8,
  quizCorrect: 10,
  quizPerfect: 50,
  matchedWord: 6,
  writtenCharacter: 12,
  chatMessage: 5,
  typedCorrect: 4,
  dailyChallenge: 30,
}

// Levels: each level needs level^2 * 100 XP
export { getLevelFromXP }

export const LEVEL_TITLES = [
  'Новичок',       // 1
  'Ученик',        // 2
  'Студент',       // 3
  'Практикант',    // 4
  'Знаток',        // 5
  'Эрудит',        // 6
  'Лингвист',      // 7
  'Полиглот',      // 8
  'Магистр',       // 9
  'Профессор',     // 10+
]

export function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[9]
  return LEVEL_TITLES[level - 1] || LEVEL_TITLES[0]
}

// Shop items catalog
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'streak_freeze',
    name: 'Заморозка стрика',
    description: 'Защищает стрик на 1 день бездействия. Автоматически используется при пропуске дня.',
    icon: '🧊',
    cost: 50,
    type: 'streak_freeze',
    consumable: true,
  },
  {
    id: 'hint',
    name: 'Подсказка',
    description: 'Открывает первую букву слова в тесте или игре сопоставления.',
    icon: '💡',
    cost: 10,
    type: 'hint',
    consumable: true,
  },
  {
    id: 'double_xp',
    name: 'Двойной XP (1 час)',
    description: 'Удваивает весь получаемый XP в течение 1 часа.',
    icon: '⚡',
    cost: 200,
    type: 'double_xp',
    consumable: true,
  },
  {
    id: 'skip_lesson',
    name: 'Пропуск урока',
    description: 'Позволяет пропустить урок и засчитать его как пройденный.',
    icon: '⏭️',
    cost: 100,
    type: 'skip_lesson',
    consumable: true,
  },
  {
    id: 'custom_theme',
    name: 'Кастомная тема',
    description: 'Разблокирует дополнительные цветовые темы интерфейса.',
    icon: '🎨',
    cost: 500,
    type: 'custom_theme',
    consumable: false,
  },
  {
    id: 'emoji_pack',
    name: 'Пак эмодзи для профиля',
    description: 'Разблокирует набор уникальных эмодзи для аватара профиля.',
    icon: '😎',
    cost: 300,
    type: 'emoji_pack',
    consumable: false,
  },
]

export interface PersonalWord {
  id: string
  languageId: string
  word: string
  transcription: string
  translation: string
  addedAt: string
  reviewed: number
  lastReviewed: string | null
  tags: string[]
  // SRS data
  srs?: {
    interval: number
    repetitions: number
    easiness: number
    dueDate: string
  }
}

export interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  type: 'streak_freeze' | 'hint' | 'double_xp' | 'skip_lesson' | 'custom_theme' | 'emoji_pack'
  consumable: boolean
}

export interface OwnedItem {
  itemId: string
  purchasedAt: string
  quantity: number
}

export interface ActivityEvent {
  id: string
  type: 'letter_learned' | 'lesson_visited' | 'quiz_completed' | 'flashcard_studied' |
        'word_matched' | 'character_written' | 'chat_message' | 'word_typed' |
        'achievement_unlocked' | 'word_added' | 'daily_challenge' | 'shop_purchase' |
        'friend_added' | 'tournament_joined' | 'level_up'
  description: string
  languageId?: string
  xpGained: number
  timestamp: string
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  reduceMotion: boolean
  soundEnabled: boolean
  autoSpeak: boolean
  dailyGoalXP: number
  notifications: {
    friendRequests: boolean
    achievements: boolean
    dailyReminders: boolean
  }
}

interface ProgressState {
  progress: { [languageId: string]: LanguageProgress }
  favorites: string[]
  achievements: Achievement[]
  streak: {
    current: number
    longest: number
    lastActiveDate: string | null
    freezes: number
  }
  activityLog: { [date: string]: number }
  xpHistory: { [date: string]: number }
  xp: number
  spentXP: number
  dailyChallenges: DailyChallenge[]
  personalDictionary: PersonalWord[]
  settings: UserSettings
  ownedItems: OwnedItem[]
  activityEvents: ActivityEvent[]
  selectedLanguage: string | null
  setSelectedLanguage: (id: string | null) => void
  markLessonVisited: (languageId: string, lessonId: string) => void
  recordQuizScore: (languageId: string, quizId: string, score: number) => void
  markLetterLearned: (languageId: string, letter: string) => void
  incrementFlashcards: (languageId: string) => void
  incrementFlashcardsKnown: (languageId: string) => void
  incrementMatchedWords: (languageId: string, count: number) => void
  incrementWrittenCharacters: (languageId: string) => void
  incrementChatMessages: (languageId: string) => void
  incrementTypedCorrect: (languageId: string) => void
  toggleFavorite: (languageId: string) => void
  resetProgress: () => void
  getLanguageProgress: (languageId: string) => LanguageProgress
  recordActivity: () => void
  checkAchievements: () => Achievement[]
  addXP: (amount: number) => void
  generateDailyChallenges: () => void
  updateDailyChallenge: (type: DailyChallenge['type'], amount: number) => void
  // Personal dictionary
  addWord: (word: Omit<PersonalWord, 'id' | 'addedAt' | 'reviewed' | 'lastReviewed'>) => void
  removeWord: (id: string) => void
  reviewWord: (id: string) => void
  reviewWordWithSRS: (id: string, quality: number) => void
  // Tags
  addTagToWord: (wordId: string, tag: string) => void
  removeTagFromWord: (wordId: string, tag: string) => void
  // Shop
  purchaseItem: (item: ShopItem) => boolean
  consumeItem: (itemId: string) => boolean
  // Activity history
  logActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  // Settings
  updateSettings: (partial: Omit<Partial<UserSettings>, 'notifications'> & { notifications?: Partial<UserSettings['notifications']> }) => void
  // Export/Import
  exportData: () => string
  importData: (json: string) => boolean
}

const emptyProgress: LanguageProgress = {
  visitedLessons: [],
  completedQuizzes: {},
  learnedLetters: [],
  flashcardsStudied: 0,
  flashcardsKnown: 0,
  matchedWords: 0,
  writtenCharacters: 0,
  chatMessages: 0,
  typedCorrectly: 0,
}

// All achievements definitions
export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first-step', title: 'Первый шаг', description: 'Открыть первый язык', icon: '🎯' },
  { id: 'first-letter', title: 'Первая буква', description: 'Изучить первую букву алфавита', icon: '🔤' },
  { id: 'first-lesson', title: 'Первый урок', description: 'Открыть первый урок', icon: '📚' },
  { id: 'first-quiz', title: 'Первый тест', description: 'Пройти первый тест', icon: '✏️' },
  { id: 'first-flashcard', title: 'Первая карточка', description: 'Изучить первую флеш-карту', icon: '🃏' },
  { id: 'polyglot', title: 'Полиглот', description: 'Открыть все 7 языков', icon: '🌍' },
  { id: 'scholar', title: 'Учёный', description: 'Пройти 10 уроков', icon: '🎓' },
  { id: 'master-letters', title: 'Мастер алфавита', description: 'Изучить 50 букв', icon: '✨' },
  { id: 'perfect-score', title: 'Идеальный счёт', description: 'Получить 100% в тесте', icon: '🏆' },
  { id: 'flashcard-master', title: 'Мастер карточек', description: 'Изучить 50 флеш-карт', icon: '⚡' },
  { id: 'word-matcher', title: 'Словарь', description: 'Сопоставить 30 слов', icon: '🔗' },
  { id: 'calligrapher', title: 'Каллиграф', description: 'Написать 20 символов от руки', icon: '🖌️' },
  { id: 'streak-3', title: '3 дня подряд', description: 'Поддерживать стрик 3 дня', icon: '🔥' },
  { id: 'streak-7', title: 'Неделя!', description: 'Поддерживать стрик 7 дней', icon: '🌟' },
  { id: 'favorite-collector', title: 'Коллекционер', description: 'Добавить 3 языка в избранное', icon: '❤️' },
  { id: 'chatterbox', title: 'Болтун', description: 'Отправить 20 сообщений ИИ-преподавателю', icon: '💬' },
  { id: 'typist', title: 'Машинистка', description: 'Правильно напечатать 30 слов', icon: '⌨️' },
  { id: 'level-5', title: 'Знаток', description: 'Достичь 5 уровня', icon: '⭐' },
  { id: 'level-10', title: 'Профессор', description: 'Достичь 10 уровня', icon: '👑' },
  { id: 'xp-1000', title: 'Тысячник', description: 'Набрать 1000 XP', icon: '💎' },
  { id: 'daily-warrior', title: 'Воин дня', description: 'Выполнить 5 ежедневных заданий', icon: '⚔️' },
]

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const now = Date.now()
  const yesterday = new Date(now - 86400000)
  return dateStr === todayStrForDate(yesterday)
}

function todayStrForDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Helper to add XP and record it in xpHistory
function addXpWithHistory(state: ProgressState, amount: number) {
  const today = todayStr()
  return {
    xp: state.xp + amount,
    xpHistory: {
      ...state.xpHistory,
      [today]: (state.xpHistory[today] || 0) + amount,
    },
  }
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      favorites: [],
      achievements: [],
      streak: { current: 0, longest: 0, lastActiveDate: null, freezes: 0 },
      activityLog: {},
      xpHistory: {},
      xp: 0,
      spentXP: 0,
      dailyChallenges: [],
      personalDictionary: [],
      settings: {
        theme: 'system',
        reduceMotion: false,
        soundEnabled: true,
        autoSpeak: false,
        dailyGoalXP: 100,
        notifications: {
          friendRequests: true,
          achievements: true,
          dailyReminders: true,
        },
      },
      ownedItems: [],
      activityEvents: [],
      selectedLanguage: null,
      setSelectedLanguage: (id) => set({ selectedLanguage: id }),
      markLessonVisited: (languageId, lessonId) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          if (current.visitedLessons.includes(lessonId)) return state
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                visitedLessons: [...current.visitedLessons, lessonId],
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.lessonVisited),
          }
        }),
      recordQuizScore: (languageId, quizId, score) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          const prevScore = current.completedQuizzes[quizId] || 0
          const newScore = Math.max(prevScore, score)
          // Award XP only for improvement
          const xpGain = score > prevScore
            ? Math.round((score - prevScore) / 100 * XP_REWARDS.quizCorrect * 5) + (score === 100 ? XP_REWARDS.quizPerfect : 0)
            : 0
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                completedQuizzes: {
                  ...current.completedQuizzes,
                  [quizId]: newScore,
                },
              },
            },
            ...addXpWithHistory(state, xpGain),
          }
        }),
      markLetterLearned: (languageId, letter) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          if (current.learnedLetters.includes(letter)) return state
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                learnedLetters: [...current.learnedLetters, letter],
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.letterLearned),
          }
        }),
      incrementFlashcards: (languageId) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                flashcardsStudied: current.flashcardsStudied + 1,
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.flashcardStudied),
          }
        }),
      incrementFlashcardsKnown: (languageId) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                flashcardsKnown: current.flashcardsKnown + 1,
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.flashcardKnown),
          }
        }),
      incrementMatchedWords: (languageId, count) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                matchedWords: current.matchedWords + count,
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.matchedWord * count),
          }
        }),
      incrementWrittenCharacters: (languageId) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                writtenCharacters: current.writtenCharacters + 1,
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.writtenCharacter),
          }
        }),
      incrementChatMessages: (languageId) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                chatMessages: current.chatMessages + 1,
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.chatMessage),
          }
        }),
      incrementTypedCorrect: (languageId) =>
        set((state) => {
          const current = state.progress[languageId] || emptyProgress
          return {
            progress: {
              ...state.progress,
              [languageId]: {
                ...current,
                typedCorrectly: current.typedCorrectly + 1,
              },
            },
            ...addXpWithHistory(state, XP_REWARDS.typedCorrect),
          }
        }),
      toggleFavorite: (languageId) =>
        set((state) => ({
          favorites: state.favorites.includes(languageId)
            ? state.favorites.filter((id) => id !== languageId)
            : [...state.favorites, languageId],
        })),
      resetProgress: () =>
        set({
          progress: {},
          favorites: [],
          achievements: [],
          streak: { current: 0, longest: 0, lastActiveDate: null, freezes: 0 },
          activityLog: {},
          xpHistory: {},
          xp: 0,
          spentXP: 0,
          dailyChallenges: [],
          personalDictionary: [],
          ownedItems: [],
          activityEvents: [],
        }),
      getLanguageProgress: (languageId) => get().progress[languageId] || emptyProgress,
      addXP: (amount) =>
        set((state) => addXpWithHistory(state, amount)),
      recordActivity: () =>
        set((state) => {
          const today = todayStr()
          const wasActiveYesterday = isYesterday(state.streak.lastActiveDate)
          const wasActiveToday = state.streak.lastActiveDate === today

          let newStreak = state.streak.current
          let newFreezes = state.streak.freezes

          if (!wasActiveToday) {
            if (wasActiveYesterday) {
              // Continue streak
              newStreak = state.streak.current + 1
            } else if (state.streak.lastActiveDate) {
              // Streak was broken — check if we have a freeze to use
              // Calculate days missed
              const lastDate = new Date(state.streak.lastActiveDate)
              const todayDate = new Date(today)
              const daysDiff = Math.floor(
                (todayDate.getTime() - lastDate.getTime()) / 86400000
              )
              // If missed exactly 1 day and have a freeze, use it
              if (daysDiff === 2 && state.streak.freezes > 0) {
                newStreak = state.streak.current + 1
                newFreezes = state.streak.freezes - 1
              } else {
                // Streak reset
                newStreak = 1
              }
            } else {
              // First ever activity
              newStreak = 1
            }
          }

          const newLongest = Math.max(state.streak.longest, newStreak)

          return {
            streak: {
              current: newStreak,
              longest: newLongest,
              lastActiveDate: today,
              freezes: newFreezes,
            },
            activityLog: {
              ...state.activityLog,
              [today]: (state.activityLog[today] || 0) + 1,
            },
          }
        }),
      generateDailyChallenges: () =>
        set((state) => {
          const today = todayStr()
          // If we already have today's challenges, do nothing
          const allToday = state.dailyChallenges.length > 0 && state.dailyChallenges.every((c) => c.date === today)
          if (allToday) {
            return state
          }

          const allChallenges: Omit<DailyChallenge, 'date' | 'progress' | 'completed'>[] = [
            { id: 'dc-letters', title: 'Алфавит', description: 'Изучить 5 новых букв', xpReward: 30, type: 'letters', target: 5 },
            { id: 'dc-flashcards', title: 'Карточки', description: 'Изучить 10 флеш-карт', xpReward: 40, type: 'flashcards', target: 10 },
            { id: 'dc-quiz', title: 'Тест', description: 'Пройти тест на 80%+', xpReward: 50, type: 'quiz', target: 1 },
            { id: 'dc-writing', title: 'Письмо', description: 'Написать 5 символов', xpReward: 35, type: 'writing', target: 5 },
            { id: 'dc-matching', title: 'Игра', description: 'Сопоставить 6 пар', xpReward: 35, type: 'matching', target: 6 },
            { id: 'dc-chat', title: 'Общение', description: 'Обменяться 5 сообщениями с ИИ', xpReward: 25, type: 'chat', target: 5 },
          ]
          // Pick 3 random challenges
          const shuffled = [...allChallenges].sort(() => Math.random() - 0.5).slice(0, 3)
          return {
            dailyChallenges: shuffled.map((c) => ({
              ...c,
              date: today,
              progress: 0,
              completed: false,
            })),
          }
        }),
      updateDailyChallenge: (type, amount) =>
        set((state) => {
          let xpBonus = 0
          const newChallenges = state.dailyChallenges.map((c) => {
            if (c.type === type && !c.completed) {
              const newProgress = Math.min(c.progress + amount, c.target)
              const newlyCompleted = newProgress >= c.target && c.progress < c.target
              if (newlyCompleted) {
                xpBonus += c.xpReward
              }
              return { ...c, progress: newProgress, completed: newProgress >= c.target }
            }
            return c
          })
          return {
            dailyChallenges: newChallenges,
            ...(xpBonus > 0 ? addXpWithHistory(state, xpBonus) : {}),
          }
        }),
      checkAchievements: () => {
        const state = get()
        const unlockedIds = new Set(state.achievements.map((a) => a.id))
        const newlyUnlocked: Achievement[] = []

        const totalLessons = Object.values(state.progress).reduce(
          (sum, p) => sum + p.visitedLessons.length, 0
        )
        const totalLetters = Object.values(state.progress).reduce(
          (sum, p) => sum + p.learnedLetters.length, 0
        )
        const totalFlashcards = Object.values(state.progress).reduce(
          (sum, p) => sum + p.flashcardsStudied, 0
        )
        const totalMatched = Object.values(state.progress).reduce(
          (sum, p) => sum + p.matchedWords, 0
        )
        const totalWritten = Object.values(state.progress).reduce(
          (sum, p) => sum + p.writtenCharacters, 0
        )
        const totalQuizzes = Object.values(state.progress).reduce(
          (sum, p) => sum + Object.keys(p.completedQuizzes).length, 0
        )
        const totalChat = Object.values(state.progress).reduce(
          (sum, p) => sum + p.chatMessages, 0
        )
        const totalTyped = Object.values(state.progress).reduce(
          (sum, p) => sum + p.typedCorrectly, 0
        )
        const hasPerfect = Object.values(state.progress).some((p) =>
          Object.values(p.completedQuizzes).some((s) => s === 100)
        )
        const openedLanguages = Object.keys(state.progress).length
        const level = getLevelFromXP(state.xp).level
        const completedDailies = state.dailyChallenges.filter((c) => c.completed).length

        const conditions: { [id: string]: boolean } = {
          'first-step': openedLanguages >= 1,
          'first-letter': totalLetters >= 1,
          'first-lesson': totalLessons >= 1,
          'first-quiz': totalQuizzes >= 1,
          'first-flashcard': totalFlashcards >= 1,
          'polyglot': openedLanguages >= 7,
          'scholar': totalLessons >= 10,
          'master-letters': totalLetters >= 50,
          'perfect-score': hasPerfect,
          'flashcard-master': totalFlashcards >= 50,
          'word-matcher': totalMatched >= 30,
          'calligrapher': totalWritten >= 20,
          'streak-3': state.streak.current >= 3,
          'streak-7': state.streak.current >= 7,
          'favorite-collector': state.favorites.length >= 3,
          'chatterbox': totalChat >= 20,
          'typist': totalTyped >= 30,
          'level-5': level >= 5,
          'level-10': level >= 10,
          'xp-1000': state.xp >= 1000,
          'daily-warrior': completedDailies >= 5,
        }

        for (const def of ACHIEVEMENTS) {
          if (conditions[def.id] && !unlockedIds.has(def.id)) {
            const achievement: Achievement = {
              ...def,
              unlockedAt: new Date().toISOString(),
            }
            newlyUnlocked.push(achievement)
          }
        }

        if (newlyUnlocked.length > 0) {
          set({
            achievements: [...state.achievements, ...newlyUnlocked],
          })
        }

        return newlyUnlocked
      },
      // Personal dictionary
      addWord: (word) =>
        set((state) => {
          // Avoid duplicates by word+languageId
          const exists = state.personalDictionary.some(
            (w) => w.word === word.word && w.languageId === word.languageId
          )
          if (exists) return state
          const newWord: PersonalWord = {
            ...word,
            id: `word-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            addedAt: new Date().toISOString(),
            reviewed: 0,
            lastReviewed: null,
            tags: [],
          }
          return { personalDictionary: [newWord, ...state.personalDictionary] }
        }),
      removeWord: (id) =>
        set((state) => ({
          personalDictionary: state.personalDictionary.filter((w) => w.id !== id),
        })),
      // Tags
      addTagToWord: (wordId, tag) =>
        set((state) => ({
          personalDictionary: state.personalDictionary.map((w) =>
            w.id === wordId && !w.tags.includes(tag)
              ? { ...w, tags: [...w.tags, tag] }
              : w
          ),
        })),
      removeTagFromWord: (wordId, tag) =>
        set((state) => ({
          personalDictionary: state.personalDictionary.map((w) =>
            w.id === wordId
              ? { ...w, tags: w.tags.filter((t) => t !== tag) }
              : w
          ),
        })),
      // Shop
      purchaseItem: (item) => {
        const state = get()
        const availableXP = state.xp - state.spentXP
        if (availableXP < item.cost) return false

        const existing = state.ownedItems.find((o) => o.itemId === item.id)
        let ownedItems: OwnedItem[]
        if (existing) {
          ownedItems = state.ownedItems.map((o) =>
            o.itemId === item.id
              ? { ...o, quantity: o.quantity + 1 }
              : o
          )
        } else {
          ownedItems = [
            ...state.ownedItems,
            {
              itemId: item.id,
              purchasedAt: new Date().toISOString(),
              quantity: 1,
            },
          ]
        }

        // Log activity
        const event: ActivityEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'shop_purchase',
          description: `Куплено: ${item.name}`,
          xpGained: -item.cost,
          timestamp: new Date().toISOString(),
        }

        set({
          spentXP: state.spentXP + item.cost,
          ownedItems,
          activityEvents: [event, ...state.activityEvents].slice(0, 200),
        })
        return true
      },
      consumeItem: (itemId) => {
        const state = get()
        const owned = state.ownedItems.find((o) => o.itemId === itemId)
        if (!owned || owned.quantity <= 0) return false

        const item = SHOP_ITEMS.find((i) => i.id === itemId)
        if (!item) return false

        let streakUpdate = state.streak

        if (item.type === 'streak_freeze') {
          streakUpdate = { ...state.streak, freezes: state.streak.freezes + 1 }
        }

        // For consumable items, decrease quantity
        let ownedItems: OwnedItem[]
        if (item.consumable) {
          ownedItems = state.ownedItems
            .map((o) =>
              o.itemId === itemId
                ? { ...o, quantity: o.quantity - 1 }
                : o
            )
            .filter((o) => o.quantity > 0)
        } else {
          ownedItems = state.ownedItems
        }

        set({ streak: streakUpdate, ownedItems })
        return true
      },
      // Activity history
      logActivity: (event) =>
        set((state) => {
          const newEvent: ActivityEvent = {
            ...event,
            id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
          }
          return {
            activityEvents: [newEvent, ...state.activityEvents].slice(0, 200),
          }
        }),
      reviewWord: (id) =>
        set((state) => ({
          personalDictionary: state.personalDictionary.map((w) =>
            w.id === id
              ? { ...w, reviewed: w.reviewed + 1, lastReviewed: new Date().toISOString() }
              : w
          ),
        })),
      reviewWordWithSRS: (id, quality) =>
        set((state) => ({
          personalDictionary: state.personalDictionary.map((w) => {
            if (w.id !== id) return w
            // Use SRS algorithm
            const prevSrs = w.srs || {
              interval: 0,
              repetitions: 0,
              easiness: 2.5,
              dueDate: new Date().toISOString(),
            }
            const q = Math.max(0, Math.min(5, quality))
            const now = new Date()
            let { interval, repetitions, easiness } = prevSrs
            if (q >= 3) {
              if (repetitions === 0) interval = 1
              else if (repetitions === 1) interval = 3
              else interval = Math.round(interval * easiness)
              repetitions += 1
            } else {
              repetitions = 0
              interval = 1
            }
            easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            easiness = Math.max(1.3, Math.min(2.8, easiness))
            const due = new Date(now)
            due.setDate(due.getDate() + interval)
            return {
              ...w,
              reviewed: w.reviewed + 1,
              lastReviewed: now.toISOString(),
              srs: {
                interval,
                repetitions,
                easiness,
                dueDate: due.toISOString(),
              },
            }
          }),
        })),
      // Settings
      updateSettings: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...partial,
            notifications: {
              ...state.settings.notifications,
              ...(partial.notifications || {}),
            },
          },
        })),
      // Export/Import
      exportData: () => {
        const state = get()
        const exportable = {
          version: 4,
          exportedAt: new Date().toISOString(),
          progress: state.progress,
          favorites: state.favorites,
          achievements: state.achievements,
          streak: state.streak,
          activityLog: state.activityLog,
          xpHistory: state.xpHistory,
          xp: state.xp,
          spentXP: state.spentXP,
          dailyChallenges: state.dailyChallenges,
          personalDictionary: state.personalDictionary,
          settings: state.settings,
          ownedItems: state.ownedItems,
          activityEvents: state.activityEvents,
        }
        return JSON.stringify(exportable, null, 2)
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (!data || typeof data !== 'object') return false
          set({
            progress: data.progress || {},
            favorites: data.favorites || [],
            achievements: data.achievements || [],
            streak: data.streak || { current: 0, longest: 0, lastActiveDate: null, freezes: 0 },
            activityLog: data.activityLog || {},
            xpHistory: data.xpHistory || {},
            xp: data.xp || 0,
            spentXP: data.spentXP || 0,
            dailyChallenges: data.dailyChallenges || [],
            personalDictionary: data.personalDictionary || [],
            settings: data.settings || get().settings,
            ownedItems: data.ownedItems || [],
            activityEvents: data.activityEvents || [],
          })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'language-learning-progress-v4',
    }
  )
)
