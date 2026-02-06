# Research Information Collector

Система автоматизированного сбора релевантной информации из открытых интернет-источников для анализа социальных, политических, экономических процессов.

## Возможности

- **Мультиисточники**: 7 научных баз (OpenAlex, arXiv, CrossRef, Semantic Scholar, PubMed, CORE, DOAJ)
- **Мультиязычность**: 10+ языков (английский, русский, китайский, японский, арабский, иврит и др.)
- **Структурированные данные**: JSON с метаданными + текстовые чанки для RAG-пайплайнов
- **Экспорт**: JSON, CSV, NDJSON форматы
- **Локальное хранение**: Browser localStorage (без базы данных)
- **Custom URL extraction**: Загрузка контента с пользовательских ссылок
- **Этичный сбор**: Задержки между запросами, только открытые API

## Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```
Приложение откроется на `http://localhost:5173`

### Сборка для продакшена
```bash
npm run build
```

### Предпросмотр production build
```bash
npm run preview
```

## Структура проекта

```
src/
├── types/                  # TypeScript интерфейсы
├── utils/                  # Утилиты обработки текста
├── services/
│   ├── storage.ts         # localStorage управление
│   ├── searchService.ts   # Координация поиска
│   └── api/               # Интеграции с API
├── components/            # React компоненты
└── App.tsx               # Главный компонент
```

## Технологический стек

- **React 18.3** - UI библиотека
- **TypeScript 5.5** - Типизация
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.4** - Стилизация
- **Lucide React** - Иконки

## Использование

### 1. Базовый поиск

1. Введите **ключевые слова** (обязательно)
2. Выберите **временной диапазон**
3. Выберите **языки** для фильтрации
4. Выберите **источники** данных
5. Нажмите **Start Search**

### 2. Просмотр результатов

Переключитесь на вкладку **Results** для просмотра:
- Список найденных документов
- Детали каждого документа
- Текстовые чанки (раскрываются по клику)
- Статистика по источникам/языкам

### 3. Экспорт данных

Используйте кнопки экспорта:
- **Export JSON** - полная структура для программной обработки
- **Export CSV** - таблица для Excel/Google Sheets
- **Export NDJSON** - построчный JSON для стриминга

## Примеры запросов

### Научные статьи по климату
```
Keywords: climate change
Date From: 2020-01-01
Date To: 2026-02-01
Languages: English, Русский
Sources: All
Max Results: 20
```

### Геополитические исследования
```
Keywords: геополитика Украина
Date From: 2024-01-01
Date To: 2026-02-01
Languages: Русский, English, 中文
Sources: OpenAlex, CrossRef
Max Results: 30
```

### Квантовые вычисления
```
Keywords: quantum computing
Date From: 2023-01-01
Date To: 2026-02-01
Languages: English
Sources: arXiv, Semantic Scholar
Max Results: 50
```

## API источники

### OpenAlex
- Открытый каталог научных работ
- Endpoint: `https://api.openalex.org`
- Rate Limit: ~10 req/sec
- Auth: Не требуется

### arXiv
- Препринты (физика, CS, математика)
- Endpoint: `https://export.arxiv.org/api`
- Format: XML (Atom)
- Rate Limit: ~3 req/sec

### CrossRef
- Метаданные научных публикаций
- Endpoint: `https://api.crossref.org`
- Rate Limit: ~50 req/sec (polite pool)
- Auth: Не требуется

### Semantic Scholar
- AI-enhanced научный поиск
- Endpoint: `https://api.semanticscholar.org`
- Rate Limit: ~100 req/5min
- Auth: Не требуется

### PubMed
- Медицинские и биологические статьи (28+ млн)
- Endpoint: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils`
- Format: JSON/XML
- Rate Limit: 3 req/sec (с задержками)
- Auth: Не требуется

### CORE
- Открытый доступ к научным работам
- Endpoint: `https://api.core.ac.uk/v3`
- Rate Limit: Зависит от плана
- Auth: Может требоваться для полного функционала
- Примечание: Бесплатный tier ограничен

### DOAJ (Directory of Open Access Journals)
- 18000+ открытых журналов
- Endpoint: `https://doaj.org/api/v3`
- Rate Limit: Not specified
- Auth: Не требуется

### Custom URL Extractor
- Загрузка контента с пользовательских ссылок
- Использует CORS proxy для обхода браузерных ограничений
- Парсирует HTML и извлекает текст
- Фильтрует по релевантности ключевым словам

## Ограничения

### Браузерная среда
- **CORS**: Ограничения для custom URLs
- **localStorage**: Размер ~5-10 MB
- **PDF**: Только ссылки (без парсинга текста)

### API
- **Rate Limits**: Встроенные задержки между запросами
- **Полнота данных**: Не все API предоставляют полный текст
- **Доступность**: Зависит от работоспособности внешних API

## Рекомендации для production

1. **Backend Proxy**: Для обхода CORS и rate limits
2. **База данных**: PostgreSQL вместо localStorage
3. **Queue System**: Bull/Redis для фоновых задач
4. **PDF Parser**: Серверный парсинг (pdf.js, pdfplumber)
5. **Caching**: Redis для кэширования результатов
6. **Monitoring**: Логирование и аналитика

## Документация

- **[README_USAGE.md](README_USAGE.md)** - Детальное руководство пользователя
- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Техническая документация
- **[TEST_SCENARIOS.md](TEST_SCENARIOS.md)** - Тестовые сценарии

## Архитектура

### Service Layer
```typescript
SearchService      // Координация поиска
  ├─ OpenAlexAPI  // Интеграция OpenAlex
  ├─ ArXivAPI     // Интеграция arXiv
  ├─ CrossRefAPI  // Интеграция CrossRef
  └─ SemanticAPI  // Интеграция Semantic Scholar

StorageService     // Управление localStorage
  ├─ saveDocuments()
  ├─ getAllDocuments()
  ├─ searchDocuments()
  └─ exportData()
```

### Data Flow
```
User Input → SearchForm
           ↓
       SearchService
           ↓
    [API Calls] → Filter → Deduplicate
           ↓
    StorageService (localStorage)
           ↓
    ResultsView (UI)
```

### Text Processing
```typescript
cleanText()           // Очистка HTML
chunkText()          // Разбивка на чанки (1000 слов, overlap 200)
calculateRelevance() // Подсчет релевантности
removeDuplicates()   // Удаление по URL
```

## Тестирование

### Unit Tests
```bash
npm run test
```

### E2E Tests (рекомендуется)
```bash
# С Cypress
npm run cypress:open

# С Playwright
npm run test:e2e
```

### Ручное тестирование
См. [TEST_SCENARIOS.md](TEST_SCENARIOS.md) для детальных сценариев

## Безопасность

- **CORS**: Работа только с публичными API
- **Rate Limiting**: Встроенные задержки
- **User-Agent**: Идентификация приложения
- **No Auth Storage**: Не храним credentials
- **XSS Protection**: Очистка HTML в текстах

## Производительность

- **Lazy Loading**: Чанки загружаются по клику
- **Debouncing**: Задержки между запросами
- **Duplicate Prevention**: Фильтрация по URL
- **Efficient Storage**: Структурированный JSON

## Лицензия

Для образовательных и исследовательских целей.

**Важно:**
- Соблюдайте Terms of Service источников
- Уважайте robots.txt
- Не перегружайте серверы запросами

## Контакты

Вопросы и предложения:
- GitHub Issues
- Email: research@example.com

---

**Версия:** 1.0.0
**Дата:** 2026-02-06
**Статус:** Production Ready
