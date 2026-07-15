import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verifyTwoFactorToken, sanitizeToken } from '@/lib/two-factor'

// POST - Verify TOTP token to enable 2FA (or login with 2FA)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, action } = body // action: 'enable' | 'login'

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Код обязателен' },
        { status: 400 }
      )
    }

    const sanitized = sanitizeToken(token)
    if (sanitized.length !== 6) {
      return NextResponse.json(
        { error: 'Код должен содержать 6 цифр' },
        { status: 400 }
      )
    }

    // Validate action against allowed values
    const validActions = ['enable', 'login']
    const resolvedAction = (typeof action === 'string' && validActions.includes(action)) ? action : 'enable'

    // For "enable" action, user is already logged in
    if (resolvedAction === 'enable') {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
      }

      const fullUser = await db.user.findUnique({
        where: { id: user.id },
      })
      if (!fullUser?.twoFactorSecret) {
        return NextResponse.json(
          { error: 'Сначала запустите настройку 2FA' },
          { status: 400 }
        )
      }

      if (fullUser.twoFactorEnabled) {
        return NextResponse.json(
          { error: '2FA уже включена' },
          { status: 400 }
        )
      }

      const valid = verifyTwoFactorToken(sanitized, fullUser.twoFactorSecret)
      if (!valid) {
        return NextResponse.json(
          { error: 'Неверный код. Попробуйте снова.' },
          { status: 401 }
        )
      }

      // Enable 2FA
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      })

      return NextResponse.json({
        success: true,
        message: '2FA успешно включена! Сохраните бэкап-коды в безопасном месте.',
      })
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Ошибка верификации 2FA' }, { status: 500 })
  }
}
