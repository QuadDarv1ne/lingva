'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="size-12 text-destructive" />
      <h2 className="text-xl font-bold">Ошибка на панели управления</h2>
      <p className="max-w-md text-center text-muted-foreground">
        Произошла ошибка в разделе дашборда. Попробуйте обновить страницу.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="default">
          <RefreshCw className="mr-2 size-4" />
          Попробовать снова
        </Button>
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          <LayoutDashboard className="mr-2 size-4" />
          На дашборд
        </Button>
      </div>
    </div>
  )
}
