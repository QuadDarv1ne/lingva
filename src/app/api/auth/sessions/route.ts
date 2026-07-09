import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, getUserSessions, getSessionToken, destroySession, destroyAllUserSessions } from '@/lib/auth'

// GET - list all active sessions for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const sessions = await getUserSessions(user.id)
    const currentToken = await getSessionToken()

    // Format sessions, mask token, mark current
    const formatted = sessions.map((s) => {
      const isCurrent = s.token === currentToken
      return {
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ip: s.ip,
        userAgent: s.userAgent,
        browser: parseBrowser(s.userAgent),
        os: parseOS(s.userAgent),
        device: parseDevice(s.userAgent),
        isCurrent,
      }
    })

    return NextResponse.json({ sessions: formatted })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// DELETE - terminate a specific session (by id) or all sessions (if id=all)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('id')
    const all = searchParams.get('all')

    if (all === 'true') {
      // Terminate all sessions except current
      const currentToken = await getSessionToken()
      await db.session.deleteMany({
        where: {
          userId: user.id,
          NOT: currentToken ? { token: currentToken } : undefined,
        },
      })
      return NextResponse.json({ success: true, terminated: 'all' })
    }

    if (sessionId) {
      // Don't allow terminating current session via this endpoint (use logout)
      const session = await db.session.findUnique({
        where: { id: sessionId },
      })
      if (!session || session.userId !== user.id) {
        return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 })
      }
      const currentToken = await getSessionToken()
      if (session.token === currentToken) {
        return NextResponse.json(
          { error: 'Нельзя завершить текущую сессию через этот endpoint. Используйте выход.' },
          { status: 400 }
        )
      }
      await destroySession(session.token)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Укажите id сессии или all=true' }, { status: 400 })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// Helpers to parse User-Agent
function parseBrowser(ua?: string | null): string {
  if (!ua) return 'Неизвестно'
  if (/edg/i.test(ua)) return 'Microsoft Edge'
  if (/chrome|chromium|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  if (/opera|opr/i.test(ua)) return 'Opera'
  return 'Другой'
}

function parseOS(ua?: string | null): string {
  if (!ua) return 'Неизвестно'
  if (/windows nt 10/i.test(ua)) return 'Windows 10/11'
  if (/windows nt 6\.3/i.test(ua)) return 'Windows 8.1'
  if (/windows nt 6\.2/i.test(ua)) return 'Windows 8'
  if (/windows nt 6\.1/i.test(ua)) return 'Windows 7'
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  return 'Другая'
}

function parseDevice(ua?: string | null): string {
  if (!ua) return 'Неизвестно'
  if (/mobile|android|iphone/i.test(ua)) return '📱 Мобильный'
  if (/ipad|tablet/i.test(ua)) return '📟 Планшет'
  return '💻 Компьютер'
}
