import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Токен обязателен' },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token)

    const user = await db.user.findFirst({
      where: {
        verifyToken: hashedToken,
        verifyTokenExp: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный или истёкший токен' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email успешно подтверждён!',
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Ошибка при подтверждении email' },
      { status: 500 }
    )
  }
}
