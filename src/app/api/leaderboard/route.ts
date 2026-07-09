import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - global leaderboard by XP
// Reads XP from progressData JSON field
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // Get all public users with progress data
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
      take: 500, // limit to top 500 for performance
    })

    // Parse XP from progressData and sort
    const ranked = users
      .map((u) => {
        let xp = 0
        let level = 1
        let streak = 0
        let achievementsCount = 0
        let languagesCount = 0
        let lessonsCount = 0

        if (u.progressData) {
          try {
            const data = JSON.parse(u.progressData)
            xp = data.xp || 0
            level = Math.floor(Math.sqrt(xp / 100)) + 1
            streak = data.streak?.current || 0
            achievementsCount = data.achievements?.length || 0
            const progress = data.progress || {}
            languagesCount = Object.keys(progress).length
            lessonsCount = Object.values(progress).reduce(
              (sum: number, p: any) => sum + (p.visitedLessons?.length || 0),
              0
            )
          } catch {
            // ignore
          }
        }

        return {
          id: u.id,
          name: u.name || 'Аноним',
          avatar: u.avatar,
          bio: u.bio,
          xp,
          level,
          streak,
          achievementsCount,
          languagesCount,
          lessonsCount,
        }
      })
      .filter((u) => u.xp > 0) // only show users with XP
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((u, i) => ({ ...u, rank: i + 1 }))

    // Get current user's rank
    const currentUser = await getCurrentUser()
    let myRank: number | null = null
    let myData: any = null

    if (currentUser) {
      const me = ranked.find((u) => u.id === currentUser.id)
      if (me) {
        myRank = me.rank
        myData = me
      } else {
        // User not in top — compute rank
        const myFullUser = await db.user.findUnique({
          where: { id: currentUser.id },
          select: { progressData: true },
        })
        if (myFullUser?.progressData) {
          try {
            const data = JSON.parse(myFullUser.progressData)
            const myXp = data.xp || 0
            if (myXp > 0) {
              const higherCount = users.filter((u) => {
                if (!u.progressData) return false
                try {
                  const d = JSON.parse(u.progressData)
                  return (d.xp || 0) > myXp
                } catch {
                  return false
                }
              }).length
              myRank = higherCount + 1
              myData = {
                id: currentUser.id,
                name: currentUser.name || 'Аноним',
                xp: myXp,
                level: Math.floor(Math.sqrt(myXp / 100)) + 1,
                streak: data.streak?.current || 0,
                achievementsCount: data.achievements?.length || 0,
                languagesCount: Object.keys(data.progress || {}).length,
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
