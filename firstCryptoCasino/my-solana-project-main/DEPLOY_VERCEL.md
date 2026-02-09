# Инструкция по деплою на Vercel

## Шаги для деплоя:

### 1. Подготовка репозитория
Убедитесь, что все изменения запушены в GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Создание проекта на Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите "Add New Project"
4. Выберите ваш репозиторий `solanaBetApp`
5. В настройках проекта:
   - **Framework Preset**: Next.js (автоматически определится)
   - **Root Directory**: `app` (важно!)
   - **Build Command**: `npm run build` (или оставьте по умолчанию)
   - **Output Directory**: `.next` (или оставьте по умолчанию)
   - **Install Command**: `npm install` (или оставьте по умолчанию)

### 3. Настройка переменных окружения

В настройках проекта Vercel перейдите в раздел **Environment Variables** и добавьте:

#### Обязательные переменные:

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

#### Опциональные переменные (рекомендуется для продакшена):

```
NEXT_PUBLIC_RPC_URL=https://your-rpc-endpoint-url
NEXT_PUBLIC_POLL_INTERVAL_ACTIVE=60000
NEXT_PUBLIC_POLL_INTERVAL_INACTIVE=120000
```

**Важно для RPC URL:**
- Публичный RPC endpoint имеет строгие ограничения по rate limiting
- Для продакшена рекомендуется использовать приватный RPC endpoint:
  - QuickNode: https://www.quicknode.com/
  - Helius: https://www.helius.dev/
  - Triton: https://triton.one/

### 4. Деплой

1. Нажмите "Deploy"
2. Дождитесь завершения сборки
3. После успешного деплоя вы получите URL вида: `your-project.vercel.app`

### 5. Настройка домена (опционально)

1. В настройках проекта перейдите в раздел **Domains**
2. Добавьте ваш кастомный домен
3. Следуйте инструкциям для настройки DNS

## Структура проекта

Проект должен быть структурирован так:
```
my-solana-project-main/
├── app/                    # ← Root directory для Vercel
│   ├── app/
│   ├── components/
│   ├── package.json
│   ├── next.config.ts
│   └── vercel.json
└── programs/               # Solana программы (не нужны для фронтенда)
```

## Проверка после деплоя

1. Убедитесь, что сайт открывается
2. Проверьте подключение кошелька
3. Проверьте работу транзакций
4. Проверьте консоль браузера на наличие ошибок

## Troubleshooting

### Ошибка "Module not found"
- Убедитесь, что Root Directory установлен в `app`
- Проверьте, что все зависимости указаны в `package.json`

### Ошибки с RPC
- Проверьте переменную окружения `NEXT_PUBLIC_RPC_URL`
- Убедитесь, что RPC endpoint доступен и не имеет rate limiting

### Проблемы с сборкой
- Проверьте логи сборки в Vercel Dashboard
- Убедитесь, что Node.js версия совместима (Vercel использует последнюю LTS)

## Обновление деплоя

После каждого push в main ветку Vercel автоматически создаст новый деплой.
Вы также можете вручную запустить деплой из Vercel Dashboard.
