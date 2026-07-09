import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shared speech synthesis utility
const LOCALE_MAP: Record<string, string> = {
  russian: 'ru-RU',
  chinese: 'zh-CN',
  english: 'en-US',
  greek: 'el-GR',
  aramaic: 'syr',
  slavic: 'cu',
  'church-slavonic': 'cu',
}

export function speak(text: string, languageId: string, rate: number = 0.8) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.lang = LOCALE_MAP[languageId] || 'ru-RU'
  window.speechSynthesis.speak(utterance)
}
