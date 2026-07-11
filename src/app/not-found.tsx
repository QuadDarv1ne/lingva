import { FileQuestion } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <FileQuestion className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Страница не найдена</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Запрашиваемая страница не существует или была перемещена.
      </p>
      <Link href="/">
        <Button variant="default">
          На главную
        </Button>
      </Link>
    </div>
  )
}
