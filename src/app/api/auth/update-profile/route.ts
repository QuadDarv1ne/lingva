import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, validateName, validatePassword, validateEmail, hashPassword, verifyPassword } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email } = body
    const updates: { name?: string | null; email?: string } = {}

    if (name !== undefined) {
      const trimmedName = name.toString().trim()
      if (trimmedName) {
        const nameCheck = validateName(trimmedName)
        if (!nameCheck.valid) {
          return NextResponse.json({ error: nameCheck.error }, { status: 400 })
        }
        updates.name = trimmedName
      } else {
        updates.name = null
      }
    }

    if (email !== undefined) {
      const newEmail = email.toString().toLowerCase()
      if (!validateEmail(newEmail)) {
        return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
      }
      // Check uniqueness
      const existing = await db.user.findUnique({ where: { email: newEmail } })
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: 'Email уже используется' },
          { status: 409 }
        )
      }
      updates.email = newEmail
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updates,
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}

// Change password (when user is logged in)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Текущий и новый пароли обязательны' },
        { status: 400 }
      )
    }

    // Fetch full user (with passwordHash)
    const fullUser = await db.user.findUnique({ where: { id: user.id } })
    if (!fullUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (!fullUser.passwordHash) {
      return NextResponse.json(
        { error: 'Учётная запись без пароля (OAuth). Используйте вход через соцсеть.' },
        { status: 400 }
      )
    }

    const valid = await verifyPassword(currentPassword, fullUser.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 401 }
      )
    }

    const pwdCheck = validatePassword(newPassword)
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Ошибка смены пароля' }, { status: 500 })
  }
}
