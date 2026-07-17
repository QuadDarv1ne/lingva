import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { parseProgressStats } from '@/lib/progress-stats'
import type { LanguageProgressData } from '@/lib/types'

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
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Get current user once (for privacy check + friendship status)
    const currentUser = await getCurrentUser()

    // Check if profile is private — only allow self and friends to view
    if (!user.isPublic) {
      if (!currentUser || currentUser.id !== user.id) {
        if (currentUser) {
          const accessFriendship = await db.friendship.findFirst({
            where: {
              OR: [
                { senderId: currentUser.id, receiverId: user.id, status: 'accepted' },
                { senderId: user.id, receiverId: currentUser.id, status: 'accepted' },
              ],
            },
          })
          if (!accessFriendship) {
            return NextResponse.json({ error: 'Профиль приватный' }, { status: 403 })
          }
        } else {
          return NextResponse.json({ error: 'Профиль приватный' }, { status: 403 })
        }
      }
    }

    const progressStats = parseProgressStats(user.progressData)
    const stats = {
      ...progressStats,
      longestStreak: 0,
      lettersLearned: 0,
      flashcardsStudied: 0,
      quizzesPassed: 0,
    }

    if (user.progressData) {
      try {
        const data = JSON.parse(user.progressData)
        stats.longestStreak = data.streak?.longest || 0
        const progress: { [key: string]: LanguageProgressData } = data.progress || {}
        stats.lettersLearned = Object.values(progress).reduce(
          (sum, p) => sum + (p.learnedLetters?.length || 0),
          0
        )
        stats.flashcardsStudied = Object.values(progress).reduce(
          (sum, p) => sum + (p.flashcardsStudied || 0),
          0
        )
        stats.quizzesPassed = Object.values(progress).reduce(
          (sum, p) => sum + Object.keys(p.completedQuizzes || {}).length,
          0
        )
      } catch {
        // ignore
      }
    }

    // Check friendship status
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

    // Only show email to self and accepted friends (not to all public visitors)
    const isFriend = friendship?.status === 'accepted'
    const showEmail = isMe || isFriend

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
      },
      isMe,
      friendship,
    })
  } catch (error) {
    console.error('Get public profile error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
