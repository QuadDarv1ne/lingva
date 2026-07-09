import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, generateVerifyToken, hashToken } from '@/lib/auth'
import { sendEmail, renderVerifyEmail } from '@/lib/email'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email уже подтверждён' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const rawToken = generateVerifyToken()
    const hashedToken = hashToken(rawToken)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await db.user.update({
      where: { id: user.id },
      data: {
        verifyToken: hashedToken,
        verifyTokenExp: expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verifyUrl = `${appUrl}/auth/verify-email?token=${rawToken}`
    const emailResult = await sendEmail(
      renderVerifyEmail({
        to: user.email,
        name: user.name,
        verifyUrl,
      })
    )

    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Письмо для подтверждения отправлено',
      ...(isDev && emailResult.devPreview
        ? {
            devVerifyUrl: verifyUrl,
          }
        : {}),
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
