# Лингва (Lingva)

[![CI](https://github.com/QuadDarv1ne/lingva/actions/workflows/ci.yml/badge.svg)](https://github.com/QuadDarv1ne/lingva/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%E2%89%A520.0.0-brightgreen)
![Bun](https://img.shields.io/badge/bun-%E2%89%A51.1.0-black)
![License](https://img.shields.io/badge/license-proprietary-red)

**Интерактивная платформа для изучения 7 языков мира:** русского, китайского, арамейского, английского, греческого, славянского и церковнославянского.

## Возможности

- **7 языков** с полными алфавитами, фразами, уроками и культурными фактами
- **Интерактивные вкладки** на каждый язык: алфавит, фразы, уроки, флеш-карты, практика письма, мини-игры, чтение, произношение, культура, AI-чат, тесты, обучение на клавиатуре
- **SRS (интервальное повторение)** — алгоритм SM-2 для оптимального запоминания слов
- **Геймификация** — XP, уровни, 21 достижение, ежедневные задания
- **Турниры** — соревнуйтесь с другими пользователями за еженедельные награды
- **Социальные функции** — друзья, таблица лидеров, уведомления
- **AI-преподаватель** — 3 режима общения: преподаватель, носитель языка, экзаменатор
- **Личный словарик** с поддержкой тегов и повторения
- **Магазин** — тратьте XP на заморозки стрика, подсказки и бонусы
- **Дашборд аналитики** — графики прогресса, тепловая карта активности
- **2FA** — двухфакторная аутентификация через Google Authenticator
- **OAuth** — вход через Google и GitHub
- **Экспорт/импорт** данных прогресса в JSON

## Стек технологий

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts
- **UI**: shadcn/ui (Radix UI primitives)
- **State**: Zustand (с персистентностью в localStorage)
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: SQLite
- **Аутентификация**: Кастомная сессия через cookies, PBKDF2 хеширование, 2FA (TOTP)
- **Язык**: TypeScript

## Быстрый старт

Проект поддерживает **два менеджера пакетов**: `bun` (быстрее всего, для локальной разработки) и `npm` (используется в `Dockerfile` и скрипте `ci:check`). Выберите любой — команды эквивалентны.

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/QuadDarv1ne/lingva.git
cd lingva

# 2. Установите зависимости (один из вариантов)
bun install          # Bun
npm install          # npm — совпадает с Docker/CI

# 3. Скопируйте .env.example в .env и настройте переменные
cp .env.example .env

# 4. Инициализируйте базу данных
bunx prisma generate && bunx prisma db push    # Bun
npx prisma generate && npx prisma db push      # npm

# 5. Запустите dev-сервер
bun run dev          # Bun
npm run dev          # npm
```

Приложение будет доступно на `http://localhost:3000`

### Проверка перед коммитом

```bash
npm run ci:check      # линт + prisma generate + db push + build (npm)
bun run ci:check:bun  # то же самое через Bun
```

### Лок-файлы

В репозитории отслеживаются **оба** лок-файла: `package-lock.json` (npm — канон для Docker/CI) и `bun.lock` (Bun — локальная разработка). Оба разрешаются из одинаковых диапазонов версий в `package.json`, а `Dockerfile` использует `npm install` (не `npm ci`), поэтому продакшн всегда резолвит зависимости из `package.json`.

> При изменении зависимостей обновляйте **оба** лок-файла (`bun install` и `npm install`), чтобы избежать расхождения версий между локальной разработкой на Bun и сборкой на npm.

## Структура проекта

```
src/
  app/              # Next.js App Router
    api/            # API endpoints (auth, progress, friends, etc.)
    auth/           # Страницы аутентификации
    dashboard/      # Дашборд аналитики
    community/      # Социальные функции (друзья, турниры, лидерборд)
  components/       # React компоненты
    sections/       # Вкладки изучения языка (алфавит, уроки, чат, etc.)
    mini-games/     # Мини-игры (анаграммы, заполнение пропусков)
    ui/             # shadcn/ui компоненты
  hooks/            # React хуки
  lib/              # Утилиты, данные языков, store, auth
prisma/             # Prisma schema
db/                 # SQLite база данных
```

## Лицензия и безопасность

- **Пользовательский контент** платформы распространяется под лицензией [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — подробности в [LICENSE](LICENSE).
- **Исходный код и программное обеспечение** платформы является собственностью Maestro7IT и не распространяется под CC BY-SA.
- О уязвимостях безопасности сообщайте приватно — см. [SECURITY.md](SECURITY.md).
