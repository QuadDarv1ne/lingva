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
        // Validate URL format — only allow http/https URLs or null
        if (avatar) {
          try {
            const url = new URL(avatar)
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              return NextResponse.json(
                { error: 'Аватар должен быть URL (http/https)' },
                { status: 400 }
              )
            }
          } catch {
            return NextResponse.json(
              { error: 'Некорректный URL аватара' },
              { status: 400 }
            )
          }
        }
        updates.avatar = avatar || null
      } else if (avatar !== null) {
        return NextResponse.json(
          { error: 'Аватар слишком длинный (макс. 1000 символов)' },
          { status: 400 }
        )
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
