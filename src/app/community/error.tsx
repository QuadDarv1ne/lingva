'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Community error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="size-12 text-destructive" />
      <h2 className="text-xl font-bold">Ошибка в сообществе</h2>
      <p className="max-w-md text-center text-muted-foreground">
        Произошла ошибка в разделе сообщества. Попробуйте обновить страницу.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="default">
          <RefreshCw className="mr-2 size-4" />
          Попробовать снова
        </Button>
        <Button onClick={() => window.location.href = '/community/friends'} variant="outline">
          <Users className="mr-2 size-4" />
          В сообщество
        </Button>
      </div>
    </div>
  )
}
