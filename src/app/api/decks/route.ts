import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { languages } from '@/lib/languages-data'

const VALID_LANGUAGE_IDS = new Set(languages.map((l) => l.id))

// Per-user rate limiting for deck creation
const deckCreateLimits = new Map<string, { count: number; windowStart: number }>()
const MAX_DECKS_PER_HOUR = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkDeckCreateRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = deckCreateLimits.get(userId)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    deckCreateLimits.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_DECKS_PER_HOUR) return false
  entry.count++
  return true
}

// GET - list user's custom decks + public decks
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const onlyMine = searchParams.get('mine') === 'true'

    if (onlyMine) {
      const decks = await db.customDeck.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      })
      return NextResponse.json({ decks: decks.map(parseDeck) })
    }

    // Get user's decks + public decks from other users
    const [myDecks, publicDecks] = await Promise.all([
      db.customDeck.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      }),
      db.customDeck.findMany({
        where: {
          isPublic: true,
          userId: { not: user.id },
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    return NextResponse.json({
      myDecks: myDecks.map(parseDeck),
      publicDecks: publicDecks.map((d) => ({
        ...parseDeck(d),
        author: d.user,
      })),
    })
  } catch (error) {
    console.error('Get decks error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST - create new deck
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (!checkDeckCreateRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Слишком много колод. Попробуйте позже.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { title, description, languageId, isPublic, cards } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
    }
    if (title.length > 100) {
      return NextResponse.json({ error: 'Название слишком длинное' }, { status: 400 })
    }
    if (!languageId || typeof languageId !== 'string') {
      return NextResponse.json({ error: 'Язык обязателен' }, { status: 400 })
    }
    if (!VALID_LANGUAGE_IDS.has(languageId.trim())) {
      return NextResponse.json({ error: 'Неизвестный язык' }, { status: 400 })
    }
    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json({ error: 'Описание слишком длинное (макс. 500 символов)' }, { status: 400 })
    }
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'Нужна хотя бы одна карточка' }, { status: 400 })
    }
    if (cards.length > 500) {
      return NextResponse.json({ error: 'Максимум 500 карточек' }, { status: 400 })
    }

    // Validate each card
    const MAX_CARD_LENGTH = 500
    for (const card of cards) {
      if (!card.front || !card.back || typeof card.front !== 'string' || typeof card.back !== 'string') {
        return NextResponse.json({ error: 'Каждая карточка должна иметь front и back' }, { status: 400 })
      }
      if (card.front.length > MAX_CARD_LENGTH || card.back.length > MAX_CARD_LENGTH) {
        return NextResponse.json(
          { error: `Максимальная длина карточки — ${MAX_CARD_LENGTH} символов` },
          { status: 400 }
        )
      }
    }

    const deck = await db.customDeck.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        languageId: languageId.trim(),
        isPublic: !!isPublic,
        cards: JSON.stringify(cards),
      },
    })

    return NextResponse.json({ success: true, deck: parseDeck(deck) })
  } catch (error) {
    console.error('Create deck error:', error)
    return NextResponse.json({ error: 'Ошибка создания' }, { status: 500 })
  }
}

// DELETE - delete deck
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }

    const deck = await db.customDeck.findUnique({ where: { id } })
    if (!deck) {
      return NextResponse.json({ error: 'Колода не найдена' }, { status: 404 })
    }
    if (deck.userId !== user.id) {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 })
    }

    await db.customDeck.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete deck error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

interface DeckCard {
  front: string
  back: string
  transcription?: string
}

function parseDeck(deck: {
  id: string
  userId: string
  title: string
  description: string | null
  languageId: string
  isPublic: boolean
  cards: string
  createdAt: Date
  updatedAt: Date
}) {
  let cards: DeckCard[] = []
  try {
    cards = JSON.parse(deck.cards)
  } catch {
    // ignore
  }
  return {
    id: deck.id,
    userId: deck.userId,
    title: deck.title,
    description: deck.description,
    languageId: deck.languageId,
    isPublic: deck.isPublic,
    cards,
    cardsCount: cards.length,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  }
}
