import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyPassword } from '@/lib/auth'
import { verifyTwoFactorToken, sanitizeToken } from '@/lib/two-factor'

// POST - Disable 2FA (requires password or valid TOTP)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { token, password } = body

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
    })
    if (!fullUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (!fullUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA не включена' },
        { status: 400 }
      )
    }

    // Verify either TOTP token or current password
    let verified = false

    if (token) {
      const sanitized = sanitizeToken(token)
      if (sanitized.length === 6 && fullUser.twoFactorSecret) {
        verified = verifyTwoFactorToken(sanitized, fullUser.twoFactorSecret)
      }
    }

    if (!verified && password && fullUser.passwordHash) {
      verified = await verifyPassword(password, fullUser.passwordHash)
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'Неверный код или пароль' },
        { status: 401 }
      )
    }

    // Disable 2FA
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupHash: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA отключена',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json({ error: 'Ошибка отключения 2FA' }, { status: 500 })
  }
}
