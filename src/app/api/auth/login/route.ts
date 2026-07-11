import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  validateEmail,
  getRequestMetadata,
  recordLoginAttempt,
  checkRateLimit,
} from '@/lib/auth'
import { verifyTwoFactorToken, sanitizeToken } from '@/lib/two-factor'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, rememberMe, twoFactorToken, backupCode } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Некорректный email' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const metadata = getRequestMetadata(req)

    // Rate limiting
    const rateLimit = await checkRateLimit(normalizedEmail)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Слишком много попыток входа. Попробуйте через 15 минут. Осталось попыток: ${rateLimit.remaining}`,
        },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always run verifyPassword to mitigate timing attacks
    const fakeHash = '$100000.0000000000000000000000000000000000000000000000000000000000000000'
    const valid = user?.passwordHash
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, fakeHash)

    if (!user || !valid) {
      await recordLoginAttempt(normalizedEmail, false, metadata)
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // If 2FA is enabled, require TOTP token or backup code
    if (user.twoFactorEnabled) {
      // If user provided 2FA token, verify it
      if (twoFactorToken) {
        const sanitized = sanitizeToken(twoFactorToken)
        if (sanitized.length !== 6) {
          return NextResponse.json(
            { error: 'Код должен содержать 6 цифр' },
            { status: 400 }
          )
        }
        if (!user.twoFactorSecret) {
          return NextResponse.json(
            { error: '2FA настроена некорректно. Обратитесь к администратору.' },
            { status: 500 }
          )
        }
        const totpValid = verifyTwoFactorToken(sanitized, user.twoFactorSecret)
        if (!totpValid) {
          await recordLoginAttempt(normalizedEmail, false, metadata)
          return NextResponse.json(
            { error: 'Неверный 2FA код' },
            { status: 401 }
          )
        }
      } else if (backupCode) {
        // Verify backup code
        if (!user.twoFactorBackupHash) {
          return NextResponse.json(
            { error: 'Бэкап-коды не настроены' },
            { status: 400 }
          )
        }
        const { consumeBackupCode } = await import('@/lib/two-factor')
        const { newHash, found } = consumeBackupCode(user.twoFactorBackupHash, backupCode)
        if (!found) {
          await recordLoginAttempt(normalizedEmail, false, metadata)
          return NextResponse.json(
            { error: 'Неверный бэкап-код' },
            { status: 401 }
          )
        }
        // Remove used backup code
        await db.user.update({
          where: { id: user.id },
          data: { twoFactorBackupHash: newHash },
        })
      } else {
        // No 2FA code provided — create a short-lived session for the 2FA step
        const token = await createSession(user.id, metadata, false)
        await setSessionCookie(token, false)
        return NextResponse.json({
          requiresTwoFactor: true,
          message: 'Введите код из приложения аутентификатора',
        })
      }
    }

    // Successful login
    await recordLoginAttempt(normalizedEmail, true, metadata)

    const token = await createSession(user.id, metadata, !!rememberMe)
    await setSessionCookie(token, !!rememberMe)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}
