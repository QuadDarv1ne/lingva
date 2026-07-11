'use client'

import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <AlertTriangle className="size-16 text-destructive" />
          <h1 className="text-2xl font-bold">Критическая ошибка</h1>
          <p className="max-w-md text-center text-muted-foreground">
            Произошла критическая ошибка приложения. Пожалуйста, обновите страницу.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Обновить страницу
          </button>
        </div>
      </body>
    </html>
  )
}
