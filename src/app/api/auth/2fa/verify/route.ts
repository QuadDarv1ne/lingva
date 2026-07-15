import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verifyTwoFactorToken, sanitizeToken } from '@/lib/two-factor'

// Rate limiting for 2FA verification attempts (max 5 per 10 minutes per user)
const verifyAttempts = new Map<string, { count: number; windowStart: number }>()
const MAX_VERIFY_ATTEMPTS = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
let lastCleanup = 0
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000

function cleanupVerifyLimits() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of verifyAttempts) {
    if (now - entry.windowStart > RATE_WINDOW_MS) verifyAttempts.delete(key)
  }
}

function checkVerifyRateLimit(userId: string): boolean {
  cleanupVerifyLimits()
  const now = Date.now()
  const entry = verifyAttempts.get(userId)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    verifyAttempts.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_VERIFY_ATTEMPTS) return false
  entry.count++
  return true
}

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

      // Rate limit 2FA verification attempts to prevent brute-force
      if (!checkVerifyRateLimit(user.id)) {
        return NextResponse.json(
          { error: 'Слишком много попыток. Попробуйте через 10 минут.' },
          { status: 429 }
        )
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
