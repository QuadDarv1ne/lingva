// Shared types for progress data stored in user.progressData JSON

export interface LanguageProgressData {
  visitedLessons: string[]
  completedQuizzes: { [quizId: string]: number }
  learnedLetters: string[]
  flashcardsStudied: number
  flashcardsKnown: number
  matchedWords: number
  writtenCharacters: number
  chatMessages: number
  typedCorrectly: number
}

export interface StreakData {
  current: number
  longest: number
  lastActiveDate: string | null
  freezes: number
}

export interface AchievementData {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface ProgressData {
  xp: number
  spentXP: number
  streak: StreakData
  progress: { [languageId: string]: LanguageProgressData }
  favorites: string[]
  achievements: AchievementData[]
  activityLog: { [date: string]: number }
  xpHistory: { [date: string]: number }
  dailyChallenges: unknown[]
  personalDictionary: unknown[]
  settings: unknown
  ownedItems: unknown[]
  activityEvents: unknown[]
}
