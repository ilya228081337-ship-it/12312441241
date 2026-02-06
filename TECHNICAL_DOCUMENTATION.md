# Research Information Collector - Техническая документация

## Обзор системы

### Назначение
Автоматизированная система сбора научной и исследовательской информации из открытых источников с сохранением в localStorage и экспортом в форматах JSON/CSV/NDJSON для использования в RAG-пайплайнах.

### Технологический стек
- **Frontend Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **Storage**: Browser localStorage API
- **Data Fetching**: Native Fetch API

## Архитектура

### Компонентная структура
```
src/
├── types/
│   └── index.ts                 # TypeScript интерфейсы
├── utils/
│   └── textProcessing.ts        # Утилиты обработки текста
├── services/
│   ├── storage.ts               # localStorage управление
│   ├── searchService.ts         # Координация поиска
│   └── api/
│       ├── openAlex.ts          # OpenAlex интеграция
│       ├── arxiv.ts             # arXiv интеграция
│       ├── crossref.ts          # CrossRef интеграция
│       └── semanticScholar.ts   # Semantic Scholar интеграция
├── components/
│   ├── SearchForm.tsx           # Форма поиска
│   ├── ResultsView.tsx          # Отображение результатов
│   └── DocumentCard.tsx         # Карточка документа
└── App.tsx                      # Главный компонент
```

### Паттерны проектирования

#### Service Layer Pattern
Бизнес-логика изолирована в сервисах:
- `SearchService` - координирует поиск
- `StorageService` - абстракция над localStorage
- API сервисы - инкапсуляция работы с внешними API

#### Component Composition
- Переиспользуемые компоненты
- Props для передачи данных и коллбэков
- Separation of Concerns

#### Repository Pattern (localStorage)
`StorageService` предоставляет CRUD операции:
- `saveDocuments()`
- `getAllDocuments()`
- `searchDocuments()`
- `deleteDocument()`
- `clearAllDocuments()`

## Модули и компоненты

### 1. Types (`src/types/index.ts`)

#### SearchParams
```typescript
interface SearchParams {
  keywords: string;           // Ключевые слова
  dateFrom: string;          // Начальная дата (YYYY-MM-DD)
  dateTo: string;            // Конечная дата (YYYY-MM-DD)
  languages: string[];       // Коды языков
  sources: string[];         // Источники данных
  customUrls?: string[];     // Пользовательские URL
  maxResults?: number;       // Макс результатов на источник
}
```

#### Document
```typescript
interface Document {
  id: string;                    // Уникальный ID
  title: string;                 // Заголовок
  authors: string[];             // Авторы
  date: string;                  // Дата публикации
  doi?: string;                  // DOI
  url: string;                   // URL источника
  language: string;              // Язык
  source: string;                // Источник
  abstract: string;              // Аннотация
  full_text_chunks: string[];    // Чанки текста
  files?: DocumentFile[];        // Файлы (PDF)
  created_at: string;            // Время создания
}
```

### 2. Text Processing (`src/utils/textProcessing.ts`)

#### cleanText()
Очистка текста от HTML и спецсимволов:
```typescript
function cleanText(text: string): string
```
- Удаляет HTML теги
- Заменяет HTML entities
- Нормализует пробелы

#### chunkText()
Разбивка текста на чанки с перекрытием:
```typescript
function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[]
```
- Размер чанка: 1000 слов (по умолчанию)
- Перекрытие: 200 слов для контекста
- Подходит для RAG-пайплайнов

#### calculateRelevance()
Расчет релевантности документа:
```typescript
function calculateRelevance(
  text: string,
  keywords: string[]
): number
```
- Подсчет вхождений ключевых слов
- Нормализация (0-1)

#### generateId()
Генерация уникальных ID:
```typescript
function generateId(): string
// Формат: doc_timestamp_randomstring
```

### 3. Storage Service (`src/services/storage.ts`)

#### Методы

**saveDocuments(documents: Document[])**
- Мёрдж с существующими данными
- Удаление дубликатов по URL
- Сохранение в localStorage

**getAllDocuments(): Document[]**
- Загрузка всех документов
- Обработка ошибок парсинга

**searchDocuments(query, filters)**
- Поиск по заголовку, аннотации, авторам
- Фильтрация по источнику, языку, датам
- Возврат отфильтрованного массива

**exportToJSON/CSV/NDJSON()**
- Форматирование данных
- Возврат строки для скачивания

**getStatistics()**
- Подсчет по источникам
- Подсчет по языкам
- Подсчет по годам

#### Ограничения localStorage
- Размер: ~5-10 MB (зависит от браузера)
- Синхронный API
- Только строки (JSON.stringify)
- Нет индексации

### 4. API Integrations

#### OpenAlex (`src/services/api/openAlex.ts`)
```
Endpoint: https://api.openalex.org/works
Method: GET
Params: search, filter, per-page
Rate Limit: ~10 req/sec
```

**Особенности:**
- Открытый API без ключа
- Поддержка фильтров по дате
- Metadata + abstracts
- Обязательный User-Agent

#### arXiv (`src/services/api/arxiv.ts`)
```
Endpoint: https://export.arxiv.org/api/query
Method: GET
Format: XML (Atom)
Rate Limit: ~3 req/sec
```

**Особенности:**
- XML парсинг через DOMParser
- Препринты (физика, CS, математика)
- Ссылки на PDF
- Сортировка по дате

#### CrossRef (`src/services/api/crossref.ts`)
```
Endpoint: https://api.crossref.org/works
Method: GET
Params: query, filter, rows
Rate Limit: ~50 req/sec (polite pool)
```

**Особенности:**
- Метаданные публикаций
- DOI registry
- Фильтры по дате публикации
- User-Agent для polite pool

#### Semantic Scholar (`src/services/api/semanticScholar.ts`)
```
Endpoint: https://api.semanticscholar.org/graph/v1/paper/search
Method: GET
Params: query, year, limit, fields
Rate Limit: ~100 req/5min
```

**Особенности:**
- AI-enhanced search
- OpenAccess PDF links
- Year-based filtering
- Rich metadata

### 5. Search Service (`src/services/searchService.ts`)

#### search()
Главный метод поиска:
```typescript
static async search(
  params: SearchParams,
  onProgress?: (message: string) => void
): Promise<SearchResult>
```

**Алгоритм:**
1. Итерация по выбранным источникам
2. Вызов соответствующего API
3. Задержка 1 сек между запросами
4. Фильтрация по языкам
5. Обработка custom URLs
6. Удаление дубликатов
7. Сохранение в localStorage
8. Callback прогресса

**Обработка ошибок:**
- Try-catch для каждого источника
- Сбор ошибок в массив
- Продолжение при ошибке одного API

#### exportData()
Экспорт в различные форматы:
```typescript
static async exportData(
  format: 'json' | 'csv' | 'ndjson'
): Promise<string>
```

#### downloadFile()
Скачивание файла в браузере:
```typescript
static downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void
```

### 6. UI Components

#### SearchForm
**Props:**
```typescript
interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
}
```

**State:**
- keywords, dates, languages, sources
- customUrls, maxResults

**Функции:**
- toggleLanguage() - переключение языков
- toggleSource() - переключение источников
- handleSubmit() - валидация и отправка

#### ResultsView
**Props:**
```typescript
interface ResultsViewProps {
  documents: Document[];
  onRefresh: () => void;
}
```

**Функции:**
- handleExport() - экспорт данных
- handleClearAll() - очистка всех данных
- Отображение статистики

#### DocumentCard
**Props:**
```typescript
interface DocumentCardProps {
  document: Document;
}
```

**State:**
- expanded - раскрытие чанков

**Отображение:**
- Заголовок + ссылка
- Badges (источник, язык, дата)
- Авторы, DOI
- Аннотация
- Файлы (PDF)
- Чанки (раскрываемые)

## Потоки данных

### Поток поиска
```
User Input → SearchForm
           ↓
      handleSearch
           ↓
    SearchService.search()
           ↓
    ┌──────┴──────────────┐
    ↓      ↓      ↓       ↓
OpenAlex arXiv CrossRef Semantic
    ↓      ↓      ↓       ↓
    └──────┬──────────────┘
           ↓
    Filter by language
           ↓
    Remove duplicates
           ↓
    StorageService.save()
           ↓
      localStorage
           ↓
    ResultsView.refresh()
```

### Поток экспорта
```
User Click → ResultsView
           ↓
     handleExport(format)
           ↓
  SearchService.exportData()
           ↓
  StorageService.exportToXXX()
           ↓
    Format conversion
           ↓
  SearchService.downloadFile()
           ↓
      Browser download
```

## Оптимизация и производительность

### Текущие оптимизации
1. **Lazy Loading**: Чанки раскрываются по клику
2. **Мемоизация**: React useState для предотвращения ререндеров
3. **Debouncing**: Задержки между API запросами
4. **Duplicate Removal**: Фильтрация по URL
5. **Chunked Storage**: Разбивка текста для эффективного хранения

### Рекомендации для масштабирования
1. **Server-Side Rendering**: Next.js для SEO
2. **Database**: PostgreSQL с full-text search
3. **Queue System**: Bull/Redis для фоновых задач
4. **Caching**: Redis для кэширования результатов
5. **CDN**: Для статических ресурсов
6. **Pagination**: Виртуализация длинных списков
7. **Web Workers**: Обработка текста в фоне
8. **IndexedDB**: Вместо localStorage для больших объемов

## Безопасность

### Реализованные меры
1. **CORS**: Работа только с публичными API
2. **Rate Limiting**: Задержки между запросами
3. **User-Agent**: Идентификация приложения
4. **No Auth Storage**: Не храним credentials
5. **Client-Side Only**: Нет бэкенда

### Риски и ограничения
1. **CORS Bypass**: Нельзя обойти без прокси
2. **API Keys**: Не храним, но некоторые API могут требовать
3. **XSS**: Очистка HTML в cleanText()
4. **Data Validation**: Проверка типов в TypeScript
5. **localStorage**: Не зашифрован

## Тестирование

### Рекомендуемые тесты

#### Unit Tests
```typescript
// textProcessing.test.ts
describe('cleanText', () => {
  it('should remove HTML tags', () => {
    expect(cleanText('<p>Test</p>')).toBe('Test');
  });
});

describe('chunkText', () => {
  it('should split text into chunks', () => {
    const text = 'word '.repeat(1500);
    const chunks = chunkText(text, 1000, 200);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
```

#### Integration Tests
```typescript
// searchService.test.ts
describe('SearchService', () => {
  it('should search OpenAlex', async () => {
    const result = await searchOpenAlex({
      keywords: 'test',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      languages: ['en'],
      sources: ['OpenAlex']
    });
    expect(result.success).toBe(true);
  });
});
```

#### E2E Tests (Cypress/Playwright)
```typescript
describe('Full search flow', () => {
  it('should perform search and save results', () => {
    cy.visit('/');
    cy.get('input[placeholder*="keywords"]').type('test');
    cy.get('button[type="submit"]').click();
    cy.wait(5000);
    cy.contains('Results').click();
    cy.get('.document-card').should('have.length.greaterThan', 0);
  });
});
```

## Развертывание

### Build
```bash
npm run build
# Output: dist/
```

### Preview
```bash
npm run preview
```

### Production Hosting
Подходящие платформы:
- **Vercel**: Автодеплой из Git
- **Netlify**: SPA с редиректами
- **GitHub Pages**: Статический хостинг
- **Cloudflare Pages**: CDN + hosting

### Environment Variables
Не требуются (все API публичные)

## Мониторинг и отладка

### Browser DevTools
- **Console**: Логи API запросов
- **Network**: Мониторинг запросов
- **Application**: Инспекция localStorage
- **Performance**: Профилирование

### Логирование
```typescript
console.error('API error:', error);
console.log('Search complete:', result);
```

### Error Handling
- Try-catch в API вызовах
- Fallback для localStorage ошибок
- User-friendly сообщения

## Расширения системы

### Возможные улучшения
1. **Больше источников**: PubMed, CORE, BASE, Google Scholar
2. **PDF Parsing**: Интеграция pdf.js
3. **NLP**: Анализ тональности, entity extraction
4. **Embeddings**: Векторизация для semantic search
5. **Scheduled Searches**: Периодические поиски
6. **Alerts**: Уведомления о новых результатах
7. **Collaboration**: Шаринг результатов
8. **Advanced Filters**: Faceted search
9. **ML Relevance**: Обучаемые модели релевантности
10. **Multi-modal**: Поддержка изображений, видео

### API для добавления
- **PubMed**: Медицинские статьи
- **CORE**: Открытый доступ
- **BASE**: Европейский поисковик
- **SSRN**: Social Science Research Network
- **RePEc**: Экономические статьи
- **JSTOR**: Гуманитарные науки (требует auth)

## FAQ

**Q: Почему localStorage вместо БД?**
A: По требованию задания. Для production используйте PostgreSQL.

**Q: Можно ли обойти CORS?**
A: Только через серверный прокси.

**Q: Как добавить новый источник?**
A: Создайте файл в `src/services/api/`, реализуйте интерфейс APIResponse.

**Q: Что делать при переполнении localStorage?**
A: Экспортируйте данные и очистите хранилище.

**Q: Можно ли парсить PDF?**
A: В браузере нужна библиотека pdf.js, лучше на сервере.

## Контакты и поддержка

- **Документация**: README_USAGE.md
- **Исходный код**: Все файлы в репозитории
- **Лицензия**: MIT (или указать свою)

---

**Версия документации:** 1.0
**Дата:** 2026-02-06
**Статус:** Production Ready
