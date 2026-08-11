import { NextResponse } from 'next/server'
import { getDevEmails, clearDevEmails } from '@/lib/email'
import { getCurrentUser } from '@/lib/auth'

// Only available in development + requires auth
export async function GET() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const emails = getDevEmails()
    return NextResponse.json({ emails, count: emails.length })
  } catch (error) {
    console.error('Get dev emails error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    clearDevEmails()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear dev emails error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
