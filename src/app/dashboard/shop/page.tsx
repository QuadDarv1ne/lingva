'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShoppingBag, Zap, Loader2, Check, Coins, Snowflake, X,
} from 'lucide-react'
import Link from 'next/link'
import { useProgressStore, SHOP_ITEMS, ShopItem, getLevelFromXP, getLevelTitle } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function ShopPage() {
  const { xp, spentXP, ownedItems, purchaseItem, consumeItem, streak } = useProgressStore()
  const { toast } = useToast()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [using, setUsing] = useState<string | null>(null)
  const useTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (useTimerRef.current) clearTimeout(useTimerRef.current)
    }
  }, [])
  const [showConfirm, setShowConfirm] = useState<ShopItem | null>(null)

  const availableXP = xp - spentXP
  const { level } = getLevelFromXP(xp)

  const handlePurchase = (item: ShopItem) => {
    setShowConfirm(item)
  }

  const confirmPurchase = async () => {
    if (!showConfirm) return
    setPurchasing(showConfirm.id)
    try {
      const success = purchaseItem(showConfirm)
      if (success) {
        toast({
          title: 'Покупка совершена! 🎉',
          description: `${showConfirm.icon} ${showConfirm.name} добавлен(о) в инвентарь`,
        })
      } else {
        toast({
          title: 'Недостаточно XP',
          description: `Нужно ещё ${showConfirm.cost - availableXP} XP`,
          variant: 'destructive',
        })
      }
    } finally {
      setPurchasing(null)
      setShowConfirm(null)
    }
  }

  const handleUse = (itemId: string) => {
    setUsing(itemId)
    const item = SHOP_ITEMS.find((i) => i.id === itemId)
    if (!item) return

    if (useTimerRef.current) clearTimeout(useTimerRef.current)
    useTimerRef.current = setTimeout(() => {
      const success = consumeItem(itemId)
      if (success) {
        toast({
          title: `Использовано: ${item.name} ${item.icon}`,
          description: item.type === 'streak_freeze'
            ? 'Заморозка стрика активирована! 🧊'
            : 'Предмет использован',
        })
      } else {
        toast({ title: 'Ошибка использования', variant: 'destructive' })
      }
      setUsing(null)
    }, 500)
  }

  const getItemQuantity = (itemId: string) => {
    return ownedItems.find((o) => o.itemId === itemId)?.quantity || 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Магазин</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Тратьте XP на бонусы
              </div>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Назад</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Balance card */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-300 dark:border-amber-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Coins className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Доступно XP
                </div>
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {availableXP.toLocaleString('ru-RU')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Уровень</div>
              <div className="text-lg font-semibold">{level} · {getLevelTitle(level)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Всего: {xp.toLocaleString('ru-RU')} · Потрачено: {spentXP.toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        </Card>

        {/* Streak freeze indicator */}
        {streak.freezes > 0 && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Snowflake className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium text-sm text-blue-900 dark:text-blue-200">
                  Активные заморозки стрика: {streak.freezes}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Автоматически используются при пропуске дня для защиты стрика
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Shop items */}
        <div>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Доступные предметы
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOP_ITEMS.map((item, i) => {
              const quantity = getItemQuantity(item.id)
              const canAfford = availableXP >= item.cost
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    'p-5 h-full flex flex-col',
                    !canAfford && 'opacity-70'
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{item.icon}</div>
                      {quantity > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          В наличии: {quantity}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground flex-1 mb-4">{item.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="font-bold">{item.cost}</span>
                        <span className="text-xs text-muted-foreground">XP</span>
                      </div>
                      {quantity > 0 && item.consumable ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUse(item.id)}
                          disabled={using === item.id}
                        >
                          {using === item.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          Использовать
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford || purchasing === item.id}
                        >
                          {purchasing === item.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : null}
                          Купить
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Owned items */}
        {ownedItems.length > 0 && (
          <div>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-500" />
              Мой инвентарь
            </h2>
            <Card className="p-4">
              <div className="space-y-2">
                {ownedItems.map((owned) => {
                  const item = SHOP_ITEMS.find((i) => i.id === owned.itemId)
                  if (!item) return null
                  return (
                    <div
                      key={owned.itemId}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Куплено: {new Date(owned.purchasedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <Badge variant="secondary">×{owned.quantity}</Badge>
                      {item.consumable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUse(item.id)}
                          disabled={using === item.id}
                        >
                          {using === item.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          Использовать
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* How to earn XP */}
        <Card className="p-5 bg-muted/30 border-dashed">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            Как заработать XP?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">+5</Badge>
              <span className="text-muted-foreground">Буква</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+15</Badge>
              <span className="text-muted-foreground">Урок</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+50</Badge>
              <span className="text-muted-foreground">Тест 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+12</Badge>
              <span className="text-muted-foreground">Символ</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+8</Badge>
              <span className="text-muted-foreground">«Знаю»</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+6</Badge>
              <span className="text-muted-foreground">Пара</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+5</Badge>
              <span className="text-muted-foreground">Чат</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+30</Badge>
              <span className="text-muted-foreground">Daily</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Purchase confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
              role="dialog"
              aria-modal="true"
              aria-label="Подтверждение покупки"
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{showConfirm.icon}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowConfirm(null)}
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-bold text-lg mb-1">{showConfirm.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{showConfirm.description}</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-4">
                  <span className="text-sm">Стоимость</span>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">{showConfirm.cost}</span>
                    <span className="text-xs text-muted-foreground">XP</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 mb-4 text-sm">
                  <span>После покупки останется:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {(availableXP - showConfirm.cost).toLocaleString('ru-RU')} XP
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirm(null)}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={confirmPurchase}
                    disabled={purchasing === showConfirm.id}
                  >
                    {purchasing === showConfirm.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Купить
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
