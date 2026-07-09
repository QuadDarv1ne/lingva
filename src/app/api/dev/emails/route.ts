import { NextResponse } from 'next/server'
import { getDevEmails, clearDevEmails } from '@/lib/email'

// Only available in development
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint available only in development' },
      { status: 404 }
    )
  }
  const emails = getDevEmails()
  return NextResponse.json({ emails, count: emails.length })
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint available only in development' },
      { status: 404 }
    )
  }
  clearDevEmails()
  return NextResponse.json({ success: true })
}
