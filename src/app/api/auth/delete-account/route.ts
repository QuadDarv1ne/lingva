import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getCurrentUser,
  verifyPassword,
  deleteUserAccount,
  clearSessionCookie,
} from '@/lib/auth'

// DELETE - delete user account (requires password confirmation)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { password, confirm } = body

    // Require typing DELETE as confirmation
    if (confirm !== 'УДАЛИТЬ') {
      return NextResponse.json(
        { error: 'Для подтверждения введите "УДАЛИТЬ" в поле подтверждения' },
        { status: 400 }
      )
    }

    // Get full user with passwordHash
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
    })
    if (!fullUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // If user has password, require it
    if (fullUser.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: 'Для удаления аккаунта введите пароль' },
          { status: 400 }
        )
      }
      const valid = await verifyPassword(password, fullUser.passwordHash)
      if (!valid) {
        return NextResponse.json(
          { error: 'Неверный пароль' },
          { status: 401 }
        )
      }
    }

    // Delete account (cascades to sessions, accounts, etc.)
    await deleteUserAccount(user.id)
    await clearSessionCookie()

    return NextResponse.json({
      success: true,
      message: 'Аккаунт удалён. Все данные стёрты.',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Ошибка при удалении аккаунта' }, { status: 500 })
  }
}
