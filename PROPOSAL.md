# Предложение исполнителя: Research Information Collector

## Техническое решение

### Архитектура системы

Разработана **клиент-серверная архитектура на базе браузерного веб-приложения** с использованием современного стека технологий:

#### Frontend (Client-Side)
- **React 18** - компонентная UI библиотека с виртуальным DOM
- **TypeScript** - строгая типизация для надежности кода
- **Vite** - современный build tool с hot module replacement
- **Tailwind CSS** - utility-first CSS framework для быстрой стилизации
- **Native Fetch API** - встроенные браузерные API для HTTP запросов

#### Data Layer
- **Browser localStorage** - клиентское хранилище (5-10 MB)
- **JSON структуры** - стандартный формат обмена данными
- **Deduplicate механизм** - удаление дубликатов по URL

#### Integration Layer
- **RESTful APIs** - интеграция с открытыми научными базами
- **XML Parsing** - обработка arXiv Atom feeds
- **Rate Limiting** - контроль нагрузки на внешние сервисы

### Интегрированные источники данных

#### 1. OpenAlex (`https://openalex.org`)
- **Описание**: Открытый каталог 250+ миллионов научных работ
- **Охват**: Все научные дисциплины
- **Данные**: Метаданные, авторы, аффилиации, цитирования, abstracts
- **Преимущества**: Бесплатный, без регистрации, полностью открытый
- **Rate Limit**: ~10 req/sec

#### 2. arXiv (`https://arxiv.org`)
- **Описание**: Репозиторий препринтов (2+ млн статей)
- **Охват**: Физика, математика, CS, биология, экономика
- **Данные**: Полные тексты (PDF), метаданные, авторы
- **Преимущества**: Актуальные исследования до официальной публикации
- **Rate Limit**: ~3 req/sec

#### 3. CrossRef (`https://crossref.org`)
- **Описание**: Мировой регистр DOI (140+ млн записей)
- **Охват**: Все научные издательства
- **Данные**: Метаданные публикаций, DOI, references, funding
- **Преимущества**: Наиболее полный индекс, актуальные данные
- **Rate Limit**: ~50 req/sec (polite pool)

#### 4. Semantic Scholar (`https://semanticscholar.org`)
- **Описание**: AI-powered научный поисковик (200+ млн статей)
- **Охват**: Междисциплинарный
- **Данные**: Метаданные + AI-extracted semantic информация
- **Преимущества**: Open Access PDF links, relevance ranking
- **Rate Limit**: ~100 req/5min

### Паттерны и лучшие практики

#### Separation of Concerns
- **Presentation Layer**: React компоненты (UI)
- **Business Logic Layer**: Services (поиск, обработка)
- **Data Access Layer**: Storage service (localStorage)

#### Service Layer Pattern
Изолированная бизнес-логика в dedicated сервисах:
- `SearchService` - координация мультисорс поиска
- `StorageService` - CRUD операции над данными
- API Services - инкапсуляция внешних интеграций

#### Error Handling & Resilience
- Try-catch блоки для каждого API запроса
- Graceful degradation при сбое одного источника
- Продолжение работы при частичных ошибках
- Логирование ошибок в console

#### Ethical Web Scraping
- Задержки 1-2 сек между запросами
- User-Agent идентификация приложения
- Соблюдение Rate Limits API
- Только публичные, открытые данные

### Обработка данных

#### Text Processing Pipeline
```
Raw Text → cleanText() → chunkText() → Storage
              ↓              ↓
        Remove HTML    Split into chunks
        Normalize      (1000 words, 200 overlap)
```

#### Chunking Strategy
- **Размер чанка**: 1000 слов (оптимально для RAG)
- **Overlap**: 200 слов (сохранение контекста)
- **Разделитель**: Пробелы между словами
- **Формат**: Массив строк в `full_text_chunks[]`

#### Language Detection
Автоматическое определение языка по Unicode ranges:
- Кириллица → `ru`
- CJK characters → `zh`, `ja`, `ko`
- Arabic/Hebrew → `ar`, `he`
- Default → `en`

### Мультиязычность

Поддержка 10+ языков на всех уровнях:

| Язык | Код | Unicode Range | UI Support |
|------|-----|---------------|------------|
| English | en | Latin | ✓ |
| Русский | ru | Cyrillic | ✓ |
| 中文 | zh | CJK Unified | ✓ |
| 日本語 | ja | Hiragana/Katakana | ✓ |
| 한국어 | ko | Hangul | ✓ |
| Français | fr | Latin Extended | ✓ |
| Deutsch | de | Latin Extended | ✓ |
| Español | es | Latin Extended | ✓ |
| العربية | ar | Arabic | ✓ |
| עברית | he | Hebrew | ✓ |

### Форматы экспорта

#### JSON
```json
[
  {
    "id": "doc_...",
    "title": "...",
    "full_text_chunks": ["...", "..."]
  }
]
```
**Использование**: Программная обработка, RAG пайплайны, API

#### CSV
```csv
ID,Title,Authors,Date,URL,Abstract
doc_1,"Title","Author1;Author2",2025-01-01,https://...,"..."
```
**Использование**: Excel, Google Sheets, статистический анализ

#### NDJSON (Newline Delimited JSON)
```ndjson
{"id":"doc_1","title":"..."}
{"id":"doc_2","title":"..."}
```
**Использование**: Streaming, big data pipelines, log processing

## Масштабируемость

### Текущие возможности
- **Документы**: До ~1000 в localStorage (зависит от размера)
- **Источники**: 4 API одновременно
- **Языки**: 10+ без ограничений
- **Concurrent searches**: 1 (последовательно)

### Пути масштабирования

#### 1. Backend API (Node.js/Python)
```
Browser → Backend API → [Database]
                  ↓
              [Queue] → Workers → External APIs
```
**Преимущества:**
- Обход CORS
- Централизованное кэширование
- Параллельная обработка
- Нет лимитов localStorage

#### 2. Database Layer
**Рекомендация**: PostgreSQL + pgvector
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title TEXT,
  embedding VECTOR(1536),  -- для semantic search
  full_text TEXT,
  metadata JSONB
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
```

#### 3. Queue System
**Рекомендация**: Bull + Redis
- Фоновые задачи для API запросов
- Rate limiting на уровне очереди
- Retry механизмы
- Priority queue для срочных запросов

#### 4. Caching Layer
**Redis** для кэширования:
- API responses (TTL 24 часа)
- Часто запрашиваемые документы
- Search results

#### 5. PDF Processing
**Серверная обработка**:
- `pdf.js` (JavaScript)
- `pdfplumber` (Python)
- `Apache Tika` (Java)

## Риски и митигация

### Технические риски

#### 1. API Availability (Высокий)
**Риск**: Внешние API могут быть недоступны
**Митигация**:
- Graceful degradation (продолжение с доступными API)
- Caching responses
- Fallback источники
- Health checks

#### 2. Rate Limits (Средний)
**Риск**: Превышение лимитов при интенсивном использовании
**Митигация**:
- Встроенные delays (1-2 сек)
- Exponential backoff при 429 ошибках
- Queue system для управления нагрузкой
- Monitoring и alerting

#### 3. CORS Restrictions (Средний)
**Риск**: Браузерные ограничения для некоторых URL
**Митигация**:
- Backend proxy для критичных источников
- Использование только CORS-friendly API
- Документирование ограничений

#### 4. localStorage Limits (Средний)
**Риск**: Переполнение хранилища (5-10 MB)
**Митигация**:
- Warning при приближении к лимиту
- Функция Export & Clear
- Миграция на IndexedDB (250+ MB)
- Серверное хранилище для продакшна

#### 5. Data Quality (Низкий)
**Риск**: Неполные или некорректные данные от API
**Митигация**:
- Валидация структур данных
- Очистка HTML и спецсимволов
- Fallback значения для missing fields
- User feedback механизм

### Операционные риски

#### 1. API Changes (Средний)
**Риск**: Изменения в API без уведомления
**Митигация**:
- Модульная архитектура (легко заменить источник)
- Version pinning где возможно
- Мониторинг API responses
- Быстрое обновление интеграций

#### 2. Legal/ToS Compliance (Средний)
**Риск**: Нарушение Terms of Service
**Митигация**:
- Только публичные API
- Соблюдение rate limits
- User-Agent идентификация
- Документированное использование

### Безопасность

#### 1. XSS Attacks (Низкий)
**Риск**: Инъекция вредоносного кода через данные
**Митигация**:
- Очистка HTML в `cleanText()`
- React автоматический escaping
- Content Security Policy headers

#### 2. Data Privacy (Низкий)
**Риск**: Утечка пользовательских данных
**Митигация**:
- Нет сбора личных данных
- Client-side storage (нет передачи на сервер)
- Нет аутентификации/логинов

## Стоимость владения (TCO)

### Текущая реализация (Browser-only)
- **Hosting**: $0-10/мес (Vercel/Netlify free tier)
- **APIs**: $0/мес (все бесплатные)
- **Storage**: $0 (localStorage)
- **Total**: ~$10/мес

### Production Setup (с Backend)
- **Hosting**: $50-200/мес (VPS/Cloud)
- **Database**: $20-100/мес (PostgreSQL)
- **Cache**: $10-50/мес (Redis)
- **APIs**: $0-500/мес (зависит от объема)
- **Monitoring**: $10-50/мес
- **Total**: $90-900/мес

## Roadmap расширения

### Phase 1: MVP (Текущее состояние)
- ✓ Базовый поиск по 4 источникам
- ✓ Мультиязычность
- ✓ localStorage хранение
- ✓ Экспорт JSON/CSV/NDJSON
- ✓ Text chunking

### Phase 2: Enhanced Features (1-2 месяца)
- Backend API для обхода CORS
- Database storage (PostgreSQL)
- PDF text extraction
- Больше источников (PubMed, CORE, BASE)
- Advanced search filters
- Scheduled searches

### Phase 3: AI/ML Integration (2-3 месяца)
- Semantic search (embeddings)
- Relevance ranking ML model
- Auto-categorization
- Entity extraction (NER)
- Summarization

### Phase 4: Enterprise Features (3-6 месяцев)
- Multi-user support
- Team collaboration
- API для интеграций
- Webhooks
- Advanced analytics
- Custom data sources

## Сравнение с альтернативами

| Критерий | Наше решение | Mendeley | Zotero | Google Scholar |
|----------|--------------|----------|---------|----------------|
| Open Source | ✓ | ✗ | ✓ | ✗ |
| Multi-API | ✓ 4 sources | ✗ 1 | ✗ 1 | ✓ All |
| Text Chunking | ✓ RAG-ready | ✗ | ✗ | ✗ |
| Export Formats | JSON/CSV/NDJSON | BibTeX | BibTeX/RIS | BibTeX |
| Multilingual | ✓ 10+ langs | ✓ | ✓ | ✓ |
| Cost | Free | Freemium | Free | Free |
| Customization | ✓ Full | ✗ | ~Plugins | ✗ |

## Выводы и рекомендации

### Сильные стороны
1. **Модульная архитектура** - легко добавить новые источники
2. **Zero infrastructure** - работает в браузере
3. **Мультиязычность** - реальная поддержка 10+ языков
4. **RAG-ready** - структура данных оптимизирована для LLM
5. **Open APIs** - не зависим от коммерческих сервисов

### Ограничения
1. **Browser storage** - не подходит для больших объемов
2. **CORS** - ограничения для некоторых URL
3. **PDF parsing** - только ссылки, нет извлечения текста
4. **Single user** - нет multi-user функций

### Рекомендации для Production

**Обязательно:**
- Внедрить backend proxy (Node.js/Python FastAPI)
- Миграция на PostgreSQL
- Добавить PDF text extraction

**Желательно:**
- Очередь задач (Bull + Redis)
- Мониторинг и логирование
- Юнит и интеграционные тесты

**Опционально:**
- Embeddings для semantic search
- ML модели для relevance ranking
- Пользовательские дашборды

## Техническая поддержка

### Документация
- `README.md` - Быстрый старт
- `README_USAGE.md` - Детальное руководство пользователя
- `TECHNICAL_DOCUMENTATION.md` - Техническая документация
- `TEST_SCENARIOS.md` - Тестовые сценарии
- `EXAMPLE_OUTPUT.json` - Примеры данных

### Код
- Структурированный, с комментариями
- TypeScript типы для всех интерфейсов
- Модульная организация
- ESLint конфигурация

### Тестирование
- 10 детальных тестовых сценариев
- Критерии приёмки для каждого теста
- Примеры проверочных скриптов

---

**Подготовил**: AI Development Team
**Дата**: 2026-02-06
**Статус**: Ready for Review
**Версия**: 1.0
