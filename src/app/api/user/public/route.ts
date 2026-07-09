import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - public profile of any user (with friendship status)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        isPublic: true,
        createdAt: true,
        progressData: true,
        twoFactorEnabled: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Parse progress data
    let stats = {
      xp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      achievementsCount: 0,
      languagesCount: 0,
      lessonsCount: 0,
      lettersLearned: 0,
      flashcardsStudied: 0,
      quizzesPassed: 0,
    }

    if (user.progressData) {
      try {
        const data = JSON.parse(user.progressData)
        stats.xp = data.xp || 0
        stats.level = Math.floor(Math.sqrt(stats.xp / 100)) + 1
        stats.streak = data.streak?.current || 0
        stats.longestStreak = data.streak?.longest || 0
        stats.achievementsCount = data.achievements?.length || 0
        const progress = data.progress || {}
        stats.languagesCount = Object.keys(progress).length
        stats.lessonsCount = Object.values(progress).reduce(
          (sum: number, p: any) => sum + (p.visitedLessons?.length || 0),
          0
        )
        stats.lettersLearned = Object.values(progress).reduce(
          (sum: number, p: any) => sum + (p.learnedLetters?.length || 0),
          0
        )
        stats.flashcardsStudied = Object.values(progress).reduce(
          (sum: number, p: any) => sum + (p.flashcardsStudied || 0),
          0
        )
        stats.quizzesPassed = Object.values(progress).reduce(
          (sum: number, p: any) => sum + Object.keys(p.completedQuizzes || {}).length,
          0
        )
      } catch {
        // ignore
      }
    }

    // Get current user to check friendship status
    const currentUser = await getCurrentUser()
    let friendship: { status: string; direction: 'sent' | 'received' | null } | null = null
    let isMe = false

    if (currentUser) {
      isMe = currentUser.id === user.id
      if (!isMe) {
        const f = await db.friendship.findFirst({
          where: {
            OR: [
              { senderId: currentUser.id, receiverId: user.id },
              { senderId: user.id, receiverId: currentUser.id },
            ],
          },
        })
        if (f) {
          friendship = {
            status: f.status,
            direction: f.senderId === currentUser.id ? 'sent' : 'received',
          }
        }
      }
    }

    // Hide email if not public and not self/friend
    const isFriend = friendship?.status === 'accepted'
    const showEmail = user.isPublic || isMe || isFriend

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || 'Аноним',
        email: showEmail ? user.email : null,
        avatar: user.avatar,
        bio: user.bio,
        isPublic: user.isPublic,
        createdAt: user.createdAt,
        stats,
        twoFactorEnabled: user.twoFactorEnabled,
        emailVerified: user.emailVerified,
      },
      isMe,
      friendship,
    })
  } catch (error) {
    console.error('Get public profile error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
