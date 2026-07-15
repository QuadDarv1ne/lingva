import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST - accept friend request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { friendshipId } = body

    if (!friendshipId || typeof friendshipId !== 'string') {
      return NextResponse.json({ error: 'friendshipId обязателен' }, { status: 400 })
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    })
    if (!friendship || friendship.receiverId !== user.id) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }
    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: 'Заявка уже обработана' }, { status: 400 })
    }

    await db.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    })

    // Notify the sender
    await db.notification.create({
      data: {
        userId: friendship.senderId,
        type: 'friend_accepted',
        title: 'Заявка в друзья принята',
        message: `${user.name || user.email} принял(а) вашу заявку в друзья`,
        data: JSON.stringify({ receiverId: user.id }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept friend error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
