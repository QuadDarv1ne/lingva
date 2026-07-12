import { NextResponse } from 'next/server'
import { getDevEmails, clearDevEmails } from '@/lib/email'
import { getCurrentUser } from '@/lib/auth'

// Only available in development + requires auth
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const emails = getDevEmails()
  return NextResponse.json({ emails, count: emails.length })
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  clearDevEmails()
  return NextResponse.json({ success: true })
}
