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
      // Cap XP to a reasonable maximum (prevents injection of absurd values)
      progress.xp = Math.min(progress.xp, 10_000_000)
    }

    // Validate streakDays is a non-negative integer
    if (typeof progress.streakDays === 'number') {
      if (!Number.isInteger(progress.streakDays) || progress.streakDays < 0) {
        return NextResponse.json({ error: 'Некорректные данные streak' }, { status: 400 })
      }
      progress.streakDays = Math.min(progress.streakDays, 36500)
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
