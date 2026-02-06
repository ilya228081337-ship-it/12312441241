# Инструкция по развертыванию

## Локальная разработка

### Требования
- Node.js 18+
- npm 9+

### Установка
```bash
# Клонировать репозиторий
git clone <repository-url>
cd research-information-collector

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

### Команды разработки
```bash
npm run dev      # Режим разработки с hot-reload
npm run build    # Production build
npm run preview  # Предпросмотр production build
npm run lint     # Проверка кода ESLint
npm run typecheck # Проверка типов TypeScript
```

## Production Deployment

### Статический хостинг

#### Vercel (Рекомендуется)
```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
vercel

# Production деплой
vercel --prod
```

Автоматический деплой при push в main:
1. Подключить GitHub репозиторий
2. Импортировать проект в Vercel
3. Deploy автоматически при каждом commit

#### Netlify
```bash
# Установить Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Инициализация
netlify init

# Deploy
netlify deploy --prod
```

Или через Web UI:
1. New site from Git
2. Выбрать репозиторий
3. Build command: `npm run build`
4. Publish directory: `dist`

#### GitHub Pages
```bash
# Добавить в package.json
{
  "homepage": "https://<username>.github.io/<repo>",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# Установить gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

#### Cloudflare Pages
1. Подключить GitHub репозиторий
2. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
3. Deploy

### Переменные окружения

Не требуются! Все API публичные.

Опционально (для кастомизации):
```env
# .env
VITE_APP_NAME="Research Collector"
VITE_MAX_RESULTS_DEFAULT=20
```

### Конфигурация nginx (если используете)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/research-collector/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker (опционально)

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build
docker build -t research-collector .

# Run
docker run -p 8080:80 research-collector
```

## Мониторинг и аналитика

### Google Analytics (опционально)
```html
<!-- Добавить в index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Sentry (опционально)
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

## Production Checklist

- [ ] Build успешно выполнен
- [ ] Все TypeScript ошибки исправлены
- [ ] ESLint warnings проверены
- [ ] Протестированы основные сценарии
- [ ] Проверена производительность (Lighthouse)
- [ ] Настроен домен (если нужно)
- [ ] Настроен SSL сертификат
- [ ] Настроен мониторинг (опционально)
- [ ] Документация обновлена

## Troubleshooting

### Build fails
```bash
# Очистить кэш
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CORS errors in production
Проверьте, что используете правильные API endpoints.
Для custom URLs может потребоваться backend proxy.

### localStorage quota exceeded
Рекомендуйте пользователям экспортировать и очистить данные.
Рассмотрите миграцию на IndexedDB.

## Обновление

```bash
# Pull последние изменения
git pull origin main

# Обновить зависимости
npm install

# Rebuild
npm run build

# Redeploy
vercel --prod  # или другой метод
```

## Резервное копирование

localStorage автоматически бэкапится браузером.
Для серверной версии:

```bash
# PostgreSQL backup
pg_dump -U user -d research_db > backup.sql

# Restore
psql -U user -d research_db < backup.sql
```

---

**Документация**: README.md
**Поддержка**: GitHub Issues
**Версия**: 1.0
