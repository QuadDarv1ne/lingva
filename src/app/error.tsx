'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="size-16 text-destructive" />
      <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.
      </p>
      <Button onClick={reset} variant="default">
        <RefreshCw className="mr-2 size-4" />
        Попробовать снова
      </Button>
    </div>
  )
}
