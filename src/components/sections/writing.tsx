'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brush, Eraser, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function WritingSection({ language }: { language: Language }) {
  const { incrementWrittenCharacters, recordActivity, updateDailyChallenge } = useProgressStore()
  const isRtl = language.direction === 'rtl'

  // Pick practice characters: combine alphabet letters (first 10) for simplicity
  const practiceChars = language.alphabet.slice(0, 15)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showGuide, setShowGuide] = useState(true)
  const [hasDrawn, setHasDrawn] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [strokes, setStrokes] = useState(0)

  const currentChar = practiceChars[currentIndex]

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 8
    ctx.strokeStyle = language.id === 'chinese' ? '#dc2626' : '#0f172a'
    ctxRef.current = ctx
  }, [language.id])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setStrokes(0)
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    isDrawing.current = true
    lastPoint.current = getPos(e)
    setHasDrawn(true)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !ctxRef.current || !lastPoint.current) return
    e.preventDefault()
    const pos = getPos(e)
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPoint.current = pos
  }

  const endDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false
      lastPoint.current = null
      setStrokes((s) => s + 1)
    }
  }

  const handleNext = () => {
    if (hasDrawn) {
      incrementWrittenCharacters(language.id)
      recordActivity()
      updateDailyChallenge('writing', 1)
    }
    clearCanvas()
    setCurrentIndex((c) => (c + 1) % practiceChars.length)
  }

  const handlePrev = () => {
    clearCanvas()
    setCurrentIndex((c) => (c - 1 + practiceChars.length) % practiceChars.length)
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Brush className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Практика письма</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Обводите символ пальцем или мышью. Регулярная практика улучшает запоминание иероглифов и букв.
        </p>
      </Card>

      {/* Current char info */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Badge variant="outline">
          Символ {currentIndex + 1} / {practiceChars.length}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Символ:</span>
          <span
            className="text-3xl font-bold"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {currentChar.letter}
          </span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{currentChar.name}</span>
          <span className="text-sm text-muted-foreground italic">[{currentChar.transcription}]</span>
        </div>
      </div>

      {/* Canvas with ghost character */}
      <Card className="p-4 md:p-6">
        <div className="relative aspect-square max-w-md mx-auto bg-card rounded-lg overflow-hidden border-2 border-dashed border-border">
          {/* Ghost character */}
          {showGuide && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{
                fontSize: '18rem',
                color: 'rgba(0,0,0,0.08)',
                fontWeight: 700,
                fontFamily: 'serif',
              }}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {currentChar.letter}
            </div>
          )}
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={endDrawing}
            onPointerLeave={endDrawing}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          />
          {/* Strokes counter */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-xs font-medium border">
            {strokes} {strokes === 1 ? 'штрих' : 'штриха/штрихов'}
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={handlePrev} className="flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowGuide((s) => !s)}
          className="flex items-center gap-2"
        >
          {showGuide ? <Eraser className="w-4 h-4" /> : <Brush className="w-4 h-4" />}
          {showGuide ? 'Скрыть подсказку' : 'Показать подсказку'}
        </Button>
        <Button variant="outline" onClick={clearCanvas} className="flex items-center gap-2">
          <Eraser className="w-4 h-4" />
          Очистить
        </Button>
        <Button onClick={handleNext} className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          Сохранить и далее
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Tips */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Совет по практике</p>
            <p>
              Для {language.name}特别注意:
              {language.id === 'chinese' && ' соблюдайте порядок черт: сверху вниз, слева направо, горизонтальные перед вертикальными.'}
              {language.id === 'russian' && ' прописные буквы пишутся с наклоном вправо ~75°.'}
              {language.id === 'greek' && ' обращайте внимание на различия Γ/Γ, Ρ/Р, Η/Н — греческие буквы отличаются от кириллицы.'}
              {language.id === 'aramaic' && ' письмо пишется справа налево, сохраняйте направление штрихов.'}
              {language.id === 'english' && ' латиница пишется слева направо, строчные буквы имеют верхний и нижний регистр.'}
              {(language.id === 'slavic' || language.id === 'church-slavonic') && ' используйте полуустав: буквы квадратные, с утолщениями на концах штрихов.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
