import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  hashToken,
  validatePassword,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Токен и новый пароль обязательны' },
        { status: 400 }
      )
    }

    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 })
    }

    const hashedToken = hashToken(token)

    const user = await db.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExp: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный или истёкший токен' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    })

    // Delete all sessions for this user (force re-login)
    await db.session.deleteMany({ where: { userId: user.id } }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён. Войдите с новым паролем.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Ошибка при сбросе пароля' },
      { status: 500 }
    )
  }
}
