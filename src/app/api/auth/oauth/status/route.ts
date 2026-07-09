import { NextResponse } from 'next/server'
import { isOAuthConfigured } from '@/lib/oauth'

// GET - return which OAuth providers are configured
export async function GET() {
  return NextResponse.json({
    google: isOAuthConfigured('google'),
    github: isOAuthConfigured('github'),
  })
}
