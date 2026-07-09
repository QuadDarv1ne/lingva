import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PUT - update public profile (bio, avatar, isPublic)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { bio, avatar, isPublic } = body
    const updates: { bio?: string | null; avatar?: string | null; isPublic?: boolean } = {}

    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length <= 500) {
        updates.bio = bio.trim() || null
      } else {
        return NextResponse.json({ error: 'Bio слишком длинное (макс. 500 символов)' }, { status: 400 })
      }
    }

    if (avatar !== undefined) {
      if (typeof avatar === 'string' && avatar.length <= 1000) {
        updates.avatar = avatar || null
      }
    }

    if (isPublic !== undefined) {
      updates.isPublic = !!isPublic
    }

    await db.user.update({
      where: { id: user.id },
      data: updates,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update public profile error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
