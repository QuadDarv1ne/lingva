import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { parseProgressStats } from '@/lib/progress-stats'

// GET - global leaderboard by XP
// Reads XP from progressData JSON field
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)

    // Get public users with progress data
    // Fetch a broader pool (up to 500) then rank and slice to requested limit
    const users = await db.user.findMany({
      where: {
        isPublic: true,
        progressData: { not: null },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        progressData: true,
      },
      take: 500,
    })

    // Parse XP from progressData and sort
    const ranked = users
      .map((u) => {
        const stats = parseProgressStats(u.progressData)
        return {
          id: u.id,
          name: u.name || 'Аноним',
          avatar: u.avatar,
          bio: u.bio,
          ...stats,
        }
      })
      .filter((u) => u.xp > 0) // only show users with XP
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((u, i) => ({ ...u, rank: i + 1 }))

    // Get current user's rank
    const currentUser = await getCurrentUser()
    let myRank: number | null = null
    let myData: { id: string; name: string; xp: number; level: number; streak: number; achievementsCount: number; languagesCount: number; rank?: number } | null = null

    if (currentUser) {
      const me = ranked.find((u) => u.id === currentUser.id)
      if (me) {
        myRank = me.rank
        myData = me
      } else {
        // User not in top — compute rank using COUNT query for accuracy
        const myFullUser = await db.user.findUnique({
          where: { id: currentUser.id },
          select: { progressData: true },
        })
        if (myFullUser?.progressData) {
          try {
            const myStats = parseProgressStats(myFullUser.progressData)
            const myXp = myStats.xp
            if (myXp > 0) {
              // Count public users with higher XP using raw SQL for accuracy
              const allUsers = await db.user.findMany({
                where: {
                  isPublic: true,
                  progressData: { not: null },
                },
                select: { progressData: true },
              })
              const higherCount = allUsers.filter((u) => {
                const s = parseProgressStats(u.progressData)
                return s.xp > myXp
              }).length
              myRank = higherCount + 1
              myData = {
                id: currentUser.id,
                name: currentUser.name || 'Аноним',
                ...myStats,
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return NextResponse.json({
      leaderboard: ranked,
      myRank,
      myData,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
