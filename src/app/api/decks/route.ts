import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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

    const body = await req.json()
    const { title, description, languageId, isPublic, cards } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
    }
    if (title.length > 100) {
      return NextResponse.json({ error: 'Название слишком длинное' }, { status: 400 })
    }
    if (!languageId) {
      return NextResponse.json({ error: 'Язык обязателен' }, { status: 400 })
    }
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'Нужна хотя бы одна карточка' }, { status: 400 })
    }
    if (cards.length > 500) {
      return NextResponse.json({ error: 'Максимум 500 карточек' }, { status: 400 })
    }

    // Validate each card
    for (const card of cards) {
      if (!card.front || !card.back || typeof card.front !== 'string' || typeof card.back !== 'string') {
        return NextResponse.json({ error: 'Каждая карточка должна иметь front и back' }, { status: 400 })
      }
    }

    const deck = await db.customDeck.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        languageId,
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

function parseDeck(deck: any) {
  let cards: any[] = []
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
