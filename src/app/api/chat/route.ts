import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { languages } from '@/lib/languages-data'
import { getCurrentUser } from '@/lib/auth'

// Simple in-memory conversation store (per server instance)
const conversations = new Map<string, { role: 'system' | 'user' | 'assistant'; content: string }[]>()

const MAX_HISTORY = 20
const MAX_SESSIONS = 500
const MAX_MESSAGE_LENGTH = 2000
const ALLOWED_MODES = ['tutor', 'native', 'quiz']

// Per-user rate limiting
const rateLimits = new Map<string, { count: number; windowStart: number }>()
const MAX_MESSAGES_PER_MINUTE = 20
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(userId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_MESSAGES_PER_MINUTE) {
    return false
  }
  entry.count++
  return true
}

// Periodic cleanup of stale rate-limit entries (runs on each request)
let lastCleanup = 0
const CLEANUP_INTERVAL_MS = 5 * 60_000
function cleanupRateLimits() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of rateLimits) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimits.delete(key)
    }
  }
}

// LRU eviction: delete oldest session when limit exceeded
function evictIfNeeded() {
  while (conversations.size > MAX_SESSIONS) {
    const firstKey = conversations.keys().next().value
    if (firstKey) conversations.delete(firstKey)
    else break
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    cleanupRateLimits()

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Пожалуйста, подождите минуту.' },
        { status: 429 }
      )
    }

    const { message, languageId, mode } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Сообщение обязательно' },
        { status: 400 }
      )
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Сообщение слишком длинное (макс. ${MAX_MESSAGE_LENGTH} символов)` },
        { status: 400 }
      )
    }

    const language = languages.find((l) => l.id === languageId)
    if (!language) {
      return NextResponse.json(
        { error: 'Язык не найден' },
        { status: 400 }
      )
    }

    const resolvedMode = (typeof mode === 'string' && ALLOWED_MODES.includes(mode)) ? mode : 'tutor'

    // Build system prompt based on language and mode
    const systemPrompt = buildSystemPrompt(language, resolvedMode)

    // Get or create conversation history (keyed by authenticated user, not client session)
    const sessionKey = `${user.id}-${languageId}-${resolvedMode}`

    // On first message of session, seed with system prompt
    if (!conversations.has(sessionKey)) {
      conversations.set(sessionKey, [{ role: 'system' as const, content: systemPrompt }])
    }

    // Add user message atomically
    const updatedHistory = [
      ...(conversations.get(sessionKey) || []),
      { role: 'user' as const, content: message },
    ]

    // Trim history if too long (keep system prompt at start)
    if (updatedHistory.length > MAX_HISTORY) {
      updatedHistory.splice(0, updatedHistory.length - MAX_HISTORY + 1, updatedHistory[0])
    }

    conversations.set(sessionKey, updatedHistory)

    // Get AI response
    const zai = await ZAI.create()
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: updatedHistory,
        thinking: { type: 'disabled' },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 30_000)
      ),
    ]) as { choices: { message?: { content?: string } }[] }

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('Пустой ответ от ИИ')
    }

    // Add AI response to history atomically
    const currentHistory = conversations.get(sessionKey) || updatedHistory
    conversations.set(sessionKey, [...currentHistory, { role: 'assistant', content: aiResponse }])
    evictIfNeeded()

    return NextResponse.json({
      success: true,
      response: aiResponse,
      messageCount: updatedHistory.length - 1,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обращении к ИИ' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    cleanupRateLimits()
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Пожалуйста, подождите минуту.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const languageId = searchParams.get('languageId')
    const mode = searchParams.get('mode')

    if (!languageId) {
      return NextResponse.json(
        { error: 'languageId обязателен' },
        { status: 400 }
      )
    }

    const sessionKey = `${user.id}-${languageId}-${mode || 'tutor'}`
    conversations.delete(sessionKey)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при очистке' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(
  language: (typeof languages)[0],
  mode: string
): string {
  const baseContext = `Ты — опытный преподаватель языка ${language.name} (${language.nativeName}).
Языковые факты:
- Семья: ${language.family}
- Письменность: ${language.script}
- Эпоха: ${language.era}
- Носителей: ${language.speakers}
- Направление письма: ${language.direction === 'rtl' ? 'справа налево' : 'слева направо'}`

  switch (mode) {
    case 'tutor':
      return `${baseContext}

Твоя задача — помочь ученику изучать ${language.name} язык. Действуй так:

1. Отвечай преимущественно на русском, но приводи примеры на изучаемом языке с транскрипцией и переводом.
2. Когда ученик спрашивает о слове или фразе — давай: оригинал, транскрипцию, перевод, пример использования.
3. Объясняй грамматику простыми словами с примерами.
4. Хвали за правильные ответы и мягко исправляй ошибки.
5. Если ученик ошибается — объясни, в чём ошибка, и приведи правильный вариант.
6. Поддерживай дружелюбный и ободряющий тон.
7. Если тема выходит за рамки языка — мягко возвращай к изучению.
8. Используй эмодзи умеренно для создания тёплой атмосферы 📚✨

Пример ответа:
📚 Слово «${language.phrases[0]?.original || '—'}» (${language.phrases[0]?.transcription || '—'}) означает «${language.phrases[0]?.translation || '—'}». Это стандартное приветствие, которое можно использовать в любой ситуации.`

    case 'native':
      return `${baseContext}

Сейчас ты — носитель языка ${language.name}. Действуй так:

1. Общайся с учеником на изучаемом языке (примеры, фразы, реплики).
2. Используй русский только для пояснений сложных моментов.
3. Задавай простые вопросы на изучаемом языке и жди ответа.
4. Реагируй на ответы ученика: «Отлично!» / «Почти правильно, обратите внимание на...».
5. Постепенно усложняй диалог по мере прогресса.
6. Предлагай темы для разговора: семья, путешествия, еда, работа, погода.
7. Если ученик просит перевести — давай перевод с разбором.
8. Поощряй попытки говорить, даже с ошибками.

Цель — практика общения в живом диалоге.`

    case 'quiz':
      return `${baseContext}

Ты — экзаменатор по языку ${language.name}. Действуй так:

1. Задавай по одному вопросу за раз (не больше!).
2. Вопросы должны быть разнообразными: перевод слова, завершение фразы, выбор правильной формы, вопросы о грамматике.
3. Жди ответа ученика, не давай правильный ответ заранее.
4. После ответа сообщай, правильно или нет, и объясняй.
5. Подсчитывай счёт: «Счёт: X из Y».
6. Адаптируй сложность: если ученик отвечает правильно, усложняй; если ошибается — упрощай.
7. После 5 вопросов сообщай итог и предлагай новую тему.

Формат вопроса:
❓ Вопрос: [текст вопроса]
Варианты: 1) ... 2) ... 3) ... 4) ...`

    default:
      return baseContext
  }
}
