import { NextResponse } from 'next/server'
import { isOAuthConfigured } from '@/lib/oauth'

// GET - return whether OAuth is available
export async function GET() {
  return NextResponse.json({
    available: isOAuthConfigured('google') || isOAuthConfigured('github'),
  })
}
