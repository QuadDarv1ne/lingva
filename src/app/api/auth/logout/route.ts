import { NextResponse } from 'next/server'
import { getSessionToken, destroySession, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const token = await getSessionToken()
    if (token) {
      await destroySession(token)
    }
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Ошибка при выходе' },
      { status: 500 }
    )
  }
}
