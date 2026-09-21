import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    const sourceLang = typeof body?.sourceLang === 'string' ? body.sourceLang : 'auto'
    const targetLang = typeof body?.targetLang === 'string' ? body.targetLang : 'ru'

    if (!text) {
      return NextResponse.json(
        { error: 'Введите текст для перевода' },
        { status: 400 }
      )
    }

    const pair = sourceLang === 'auto' ? `auto|${targetLang}` : `${sourceLang}|${targetLang}`
    const url = new URL('https://api.mymemory.translated.net/get')
    url.searchParams.set('q', text)
    url.searchParams.set('langpair', pair)

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Сервис перевода временно недоступен' },
        { status: 502 }
      )
    }

    const data = await response.json()
    const translatedText =
      data?.responseData?.translatedText ||
      data?.matches?.[0]?.translation ||
      ''

    const detectedLanguage =
      data?.responseData?.detectedLanguage && data.responseData.detectedLanguage !== 'auto'
        ? data.responseData.detectedLanguage
        : sourceLang === 'auto'
          ? null
          : sourceLang

    if (!translatedText) {
      return NextResponse.json(
        { error: 'Не удалось получить перевод' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      translatedText,
      detectedLanguage,
      sourceLang,
      targetLang,
    })
  } catch {
    return NextResponse.json(
      { error: 'Не удалось выполнить перевод' },
      { status: 500 }
    )
  }
}
