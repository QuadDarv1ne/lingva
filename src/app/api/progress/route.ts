import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - retrieve user's saved progress
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { progressData: true },
    })

    if (!fullUser?.progressData) {
      return NextResponse.json({ progress: null })
    }

    try {
      const progress = JSON.parse(fullUser.progressData)
      return NextResponse.json({ progress })
    } catch {
      return NextResponse.json({ progress: null })
    }
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST - save user's progress
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Reject oversized payloads before parsing
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 600_000) {
      return NextResponse.json({ error: 'Данные слишком большие' }, { status: 400 })
    }

    const body = await req.json()
    const { progress } = body

    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }

    // Validate XP is a non-negative integer to prevent cheating
    if (typeof progress.xp === 'number') {
      if (!Number.isInteger(progress.xp) || progress.xp < 0) {
        return NextResponse.json({ error: 'Некорректные данные XP' }, { status: 400 })
      }
      progress.xp = Math.min(progress.xp, 10_000_000)
    }

    // Validate spentXP is a non-negative integer
    if (typeof progress.spentXP === 'number') {
      if (!Number.isInteger(progress.spentXP) || progress.spentXP < 0) {
        return NextResponse.json({ error: 'Некорректные данные spentXP' }, { status: 400 })
      }
      progress.spentXP = Math.min(progress.spentXP, 10_000_000)
    }

    // Validate streak data
    if (progress.streak && typeof progress.streak === 'object' && !Array.isArray(progress.streak)) {
      const streak = progress.streak
      if (typeof streak.current === 'number') {
        if (!Number.isInteger(streak.current) || streak.current < 0) {
          return NextResponse.json({ error: 'Некорректные данные streak' }, { status: 400 })
        }
        streak.current = Math.min(streak.current, 36500)
      }
      if (typeof streak.longest === 'number') {
        if (!Number.isInteger(streak.longest) || streak.longest < 0) {
          return NextResponse.json({ error: 'Некорректные данные streak' }, { status: 400 })
        }
        streak.longest = Math.min(streak.longest, 36500)
      }
    }

    // Validate arrays have reasonable sizes
    if (Array.isArray(progress.achievements) && progress.achievements.length > 200) {
      progress.achievements = progress.achievements.slice(0, 200)
    }
    if (Array.isArray(progress.favorites) && progress.favorites.length > 100) {
      progress.favorites = progress.favorites.slice(0, 100)
    }

    const progressData = JSON.stringify(progress)
    // Limit size to prevent abuse
    if (progressData.length > 500_000) {
      return NextResponse.json(
        { error: 'Данные прогресса слишком большие' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: { progressData },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save progress error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
  }
}

// DELETE - clear user's progress
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { progressData: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear progress error:', error)
    return NextResponse.json({ error: 'Ошибка очистки' }, { status: 500 })
  }
}
