import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// DELETE - remove friend (delete friendship record)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const friendshipId = searchParams.get('id')

    if (!friendshipId) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    })
    if (!friendship) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    if (friendship.senderId !== user.id && friendship.receiverId !== user.id) {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 })
    }

    await db.friendship.delete({ where: { id: friendshipId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove friend error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
