import { TranslatorPanel } from '@/components/translator-panel'

export default function TranslatorPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-background via-background to-muted/30 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Тулз</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Переводчик</h1>
        </div>

        <TranslatorPanel />
      </div>
    </main>
  )
}