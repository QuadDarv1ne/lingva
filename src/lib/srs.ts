// SRS (Spaced Repetition System) — алгоритм Anki-подобного интервального повторения
// Каждое слово имеет интервал (в днях) до следующего повторения.
// При правильном ответе интервал увеличивается, при неправильном — сбрасывается.

export interface SRSData {
  // Days until next review
  interval: number
  // Number of correct reviews in a row
  repetitions: number
  // Easiness factor (1.3 to 2.8, default 2.5)
  // Higher = faster interval growth
  easiness: number
  // Date of next review (ISO string)
  dueDate: string
  // Last review date (ISO string)
  lastReviewed: string | null
}

export const DEFAULT_SRS: SRSData = {
  interval: 0,
  repetitions: 0,
  easiness: 2.5,
  dueDate: new Date().toISOString(),
  lastReviewed: null,
}

// Quality grades (Anki-style)
// 0 — completely wrong
// 1 — wrong but easy to recall
// 2 — correct but with significant effort
// 3 — correct with some effort
// 4 — correct with little effort
// 5 — perfect recall
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Update SRS data after a review
 * Based on the SuperMemo SM-2 algorithm (simplified)
 */
export function updateSRS(prev: SRSData, quality: ReviewQuality): SRSData {
  const now = new Date()
  let { interval, repetitions, easiness } = prev

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1 // first correct: 1 day
    } else if (repetitions === 1) {
      interval = 3 // second correct: 3 days
    } else {
      interval = Math.round(interval * easiness)
    }
    repetitions += 1
  } else {
    // Incorrect response — reset
    repetitions = 0
    interval = 1 // review again tomorrow
  }

  // Update easiness factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easiness < 1.3) easiness = 1.3
  if (easiness > 2.8) easiness = 2.8

  // Calculate next due date
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + interval)

  return {
    interval,
    repetitions,
    easiness,
    dueDate: dueDate.toISOString(),
    lastReviewed: now.toISOString(),
  }
}

/**
 * Check if a word is due for review (dueDate <= now)
 */
export function isDue(srs: SRSData): boolean {
  return new Date(srs.dueDate) <= new Date()
}

/**
 * Get human-readable interval description
 */
export function formatInterval(interval: number): string {
  if (interval === 0) return 'Сегодня'
  if (interval === 1) return 'Завтра'
  if (interval < 7) return `Через ${interval} дн.`
  if (interval < 30) return `Через ${Math.round(interval / 7)} нед.`
  if (interval < 365) return `Через ${Math.round(interval / 30)} мес.`
  return `Через ${Math.round(interval / 365)} г.`
}

/**
 * Get status color for SRS card
 */
export function getSRSStatus(srs: SRSData): 'new' | 'learning' | 'young' | 'mature' {
  if (srs.repetitions === 0) return 'new'
  if (srs.repetitions < 3) return 'learning'
  if (srs.interval < 21) return 'young'
  return 'mature'
}

/**
 * Map a binary review (correct/incorrect) to quality
 */
export function qualityFromBinary(correct: boolean): ReviewQuality {
  return correct ? 4 : 1
}

/**
 * Map a 3-button review (again/hard/easy) to quality
 */
export function qualityFromThree(review: 'again' | 'hard' | 'easy'): ReviewQuality {
  if (review === 'again') return 1
  if (review === 'hard') return 3
  return 5
}
