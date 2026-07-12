'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Layers, Plus, Trash2, Loader2, X, Globe, Lock, BookOpen,
  ChevronDown, ChevronUp, Play, Edit,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { languages } from '@/lib/languages-data'
import { cn } from '@/lib/utils'

interface CustomCard {
  front: string
  back: string
  transcription?: string
}

interface Deck {
  id: string
  userId: string
  title: string
  description: string | null
  languageId: string
  isPublic: boolean
  cards: CustomCard[]
  cardsCount: number
  createdAt: string
  updatedAt: string
  author?: { id: string; name: string | null; avatar: string | null }
}

export default function DecksPage() {
  const { toast } = useToast()
  const [myDecks, setMyDecks] = useState<Deck[]>([])
  const [publicDecks, setPublicDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    languageId: 'russian',
    isPublic: false,
  })
  const [cards, setCards] = useState<CustomCard[]>([
    { front: '', back: '', transcription: '' },
  ])
  const [saving, setSaving] = useState(false)

  const loadDecks = useCallback(async () => {
    try {
      const res = await fetch('/api/decks')
      const data = await res.json()
      setMyDecks(data.myDecks || [])
      setPublicDecks(data.publicDecks || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadDecks(), 0)
    return () => clearTimeout(timer)
  }, [loadDecks])

  const addCard = () => {
    setCards([...cards, { front: '', back: '', transcription: '' }])
  }

  const removeCard = (i: number) => {
    if (cards.length === 1) return
    setCards(cards.filter((_, idx) => idx !== i))
  }

  const updateCard = (i: number, field: keyof CustomCard, value: string) => {
    setCards(cards.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast({ title: 'Введите название', variant: 'destructive' })
      return
    }
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim())
    if (validCards.length === 0) {
      toast({ title: 'Добавьте хотя бы одну карточку', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cards: validCards,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      toast({ title: 'Колода создана! ✅' })
      setShowCreateForm(false)
      setForm({ title: '', description: '', languageId: 'russian', isPublic: false })
      setCards([{ front: '', back: '', transcription: '' }])
      loadDecks()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить колоду?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/decks?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Ошибка')
      toast({ title: 'Колода удалена' })
      loadDecks()
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Колоды</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Кастомные карточки
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateForm((s) => !s)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Создать
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">← Назад</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Create form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Новая колода</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Название</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Например: Числа 1-100"
                        maxLength={100}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lang">Язык</Label>
                      <select
                        id="lang"
                        value={form.languageId}
                        onChange={(e) => setForm({ ...form, languageId: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                      >
                        {languages.map((l) => (
                          <option key={l.id} value={l.id}>{l.name} — {l.nativeName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="desc">Описание (необязательно)</Label>
                    <Textarea
                      id="desc"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Краткое описание колоды"
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Switch
                      id="public"
                      checked={form.isPublic}
                      onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
                    />
                    <Label htmlFor="public" className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">Сделать публичной</div>
                      <div className="text-xs text-muted-foreground">
                        Другие пользователи смогут использовать эту колоду
                      </div>
                    </Label>
                    {form.isPublic ? <Globe className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {/* Cards editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Карточки ({cards.length})</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addCard}>
                        <Plus className="w-3 h-3 mr-1" />
                        Добавить
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {cards.map((card, i) => (
                        <div key={i} className="flex gap-2 items-start p-2 rounded-lg border">
                          <div className="text-xs text-muted-foreground mt-2 shrink-0">#{i + 1}</div>
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Слово"
                              value={card.front}
                              onChange={(e) => updateCard(i, 'front', e.target.value)}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Перевод"
                              value={card.back}
                              onChange={(e) => updateCard(i, 'back', e.target.value)}
                              className="text-sm"
                            />
                            <Input
                              placeholder="Транскрипция"
                              value={card.transcription || ''}
                              onChange={(e) => updateCard(i, 'transcription', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeCard(i)}
                            disabled={cards.length === 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1" />
                    )}
                    Создать колоду
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My decks */}
        <div>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Мои колоды
            <Badge variant="secondary">{myDecks.length}</Badge>
          </h2>
          {myDecks.length === 0 ? (
            <Card className="p-8 text-center">
              <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">
                Создайте свою первую колоду карточек
              </p>
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Создать колоду
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {myDecks.map((deck, i) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  expanded={expandedDeck === deck.id}
                  onToggle={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
                  onDelete={() => handleDelete(deck.id)}
                  deleting={deletingId === deck.id}
                  isMine
                />
              ))}
            </div>
          )}
        </div>

        {/* Public decks */}
        {publicDecks.length > 0 && (
          <div>
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              Публичные колоды
              <Badge variant="secondary">{publicDecks.length}</Badge>
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {publicDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  expanded={expandedDeck === deck.id}
                  onToggle={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DeckCard({
  deck,
  expanded,
  onToggle,
  onDelete,
  deleting,
  isMine,
}: {
  deck: Deck
  expanded: boolean
  onToggle: () => void
  onDelete?: () => void
  deleting?: boolean
  isMine?: boolean
}) {
  const lang = languages.find((l) => l.id === deck.languageId)
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{lang?.emoji || '📚'}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{deck.title}</div>
          <div className="text-xs text-muted-foreground truncate">{lang?.name}</div>
          {deck.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{deck.description}</div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {deck.cardsCount} карт
            </Badge>
            {deck.isPublic ? (
              <Badge variant="secondary" className="text-xs text-emerald-600">
                <Globe className="w-3 h-3 mr-0.5" />
                Публичная
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-0.5" />
                Приватная
              </Badge>
            )}
            {!isMine && deck.author && (
              <span className="text-xs text-muted-foreground">от {deck.author.name || 'Аноним'}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onToggle}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Скрыть
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Посмотреть
            </>
          )}
        </Button>
        {isMine && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={deleting}
            className="text-destructive hover:bg-destructive/10"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </Button>
        )}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t space-y-1 max-h-60 overflow-y-auto"
          >
            {deck.cards.slice(0, 20).map((card, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded text-sm hover:bg-muted/50">
                <span className="font-medium flex-1">{card.front}</span>
                {card.transcription && (
                  <span className="text-xs text-muted-foreground italic">[{card.transcription}]</span>
                )}
                <span className="text-muted-foreground">→</span>
                <span className="flex-1 text-right">{card.back}</span>
              </div>
            ))}
            {deck.cards.length > 20 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                ... и ещё {deck.cards.length - 20} карточек
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
