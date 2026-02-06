# Руководство: Использование Custom URL Extractor

## Обзор

Custom URL Extractor позволяет загружать и парсить содержимое со своих URL адресов. Система автоматически:
- Загружает HTML страницы
- Извлекает текст (удаляет скрипты, стили, навигацию)
- Фильтрует по релевантности вашим ключевым словам
- Разбивает на текстовые чанки для RAG-пайплайнов

## Как использовать

### Шаг 1: Введите ключевые слова
```
Keywords: climate change resilience
```

### Шаг 2: Добавьте URL адреса
В поле "Custom URLs (optional, one per line)" введите:
```
https://example.com/article-about-climate
https://research.org/papers/climate-resilience
https://blog.science.org/global-warming
```

### Шаг 3: Отключите стандартные источники (опционально)
Если хотите искать ТОЛЬКО в custom URLs, отключите:
- OpenAlex
- arXiv
- CrossRef
- SemanticScholar
- PubMed
- CORE
- DOAJ

### Шаг 4: Запустите поиск
Нажмите "Start Search"

## Примеры использования

### Пример 1: Корпоративное исследование
```
Keywords: corporate sustainability reports
Custom URLs:
https://company1.com/sustainability
https://company2.com/esg-report
https://company3.com/environmental-policy
Sources: Custom URLs only
```

### Пример 2: Комбинированный поиск
```
Keywords: AI ethics
Custom URLs:
https://ethicslab.edu/ai-framework
https://medium.com/ai-ethics-series
https://github.com/ai-ethics-collection/docs
Sources: All (+ Custom URLs)
```

### Пример 3: Local research repository
```
Keywords: historical data analysis
Custom URLs:
https://myuniversity.edu/repository/papers/2024
https://myuniversity.edu/repository/papers/2025
Sources: Custom URLs, CrossRef, CORE
```

## Как это работает

### Процесс загрузки
```
1. Система пытается загрузить URL через CORS proxy
   ├─ Первый приоритет: allorigins.win
   ├─ Второй приоритет: corsproxy.io
   └─ Третий приоритет: Прямой fetch

2. Парсит HTML и извлекает текст
   ├─ Удаляет <script>, <style> теги
   ├─ Удаляет навигацию, footer, header
   └─ Очищает HTML entities

3. Фильтрует по релевантности
   ├─ Подсчитывает вхождения ключевых слов
   └─ Пропускает нерелевантный контент

4. Создает документ
   ├─ Разбивает текст на чанки (1000 слов, overlap 200)
   ├─ Сохраняет метаданные
   └─ Добавляет в localStorage
```

### Пример результата
```json
{
  "id": "doc_...",
  "title": "Page title or domain",
  "authors": [],
  "date": "2026-02-06",
  "url": "https://example.com/article",
  "source": "CustomURL",
  "abstract": "Extracted from page...",
  "full_text_chunks": [
    "Chunk 1...",
    "Chunk 2...",
    "Chunk 3..."
  ]
}
```

## Ограничения и решения

### Проблема: CORS ошибка
**Симптом**: URL не загружается, ошибка в консоли
```
Access-Control-Allow-Origin header missing
```

**Решения**:
1. Это нормальное браузерное ограничение
2. Система пытается использовать CORS proxy автоматически
3. Если не работает - откройте URL напрямую в браузере
4. Для production: настройте server-side proxy

### Проблема: Пустой контент
**Симптом**: "Unable to fetch content" сообщение
**Причины**:
- Сайт полностью использует JavaScript для рендеринга
- Сайт требует авторизацию
- Сайт блокирует скраппинг (robots.txt, user-agent check)

**Решение**: Используйте публичные API (OpenAlex, arXiv) вместо custom URLs

### Проблема: Низкая релевантность
**Симптом**: Много результатов, но мало релевантных
**Решение**:
- Используйте более специфичные ключевые слова
- Разбейте поиск на несколько запросов
- Комбинируйте с API источниками

### Проблема: Очень медленный поиск
**Симптом**: Поиск по 10 URL занимает 20+ секунд
**Причины**:
- Встроенные delays (1.5 сек на URL)
- Медленное соединение к прокси
- Большие страницы с медленной загрузкой

**Решение**: Нормально. Увеличьте лимит времени или ищите меньше URL одновременно

## Лучшие практики

### 1. Будьте этичны
- Уважайте robots.txt сайтов
- Не перегружайте серверы частыми запросами
- Убедитесь что имеете право загружать контент
- Указывайте источник при использовании данных

### 2. Выбирайте правильные URL
```
✓ Хорошие URL (работают обычно):
- Новостные сайты (news.com)
- Блоги (medium.com, substack.com)
- Научные хабы (github.com, gitlab.com)
- PDF на прямых ссылках

✗ Плохие URL (часто не работают):
- SPA (Single Page Applications)
- Сайты требующие JavaScript
- Защищенные сайты (требуют логин)
- Очень большие страницы (10+ MB)
```

### 3. Комбинируйте источники
```
# Вместо этого:
Keywords: machine learning
Sources: Custom URLs only
Custom URLs: (10 разных ссылок)

# Лучше так:
Keywords: machine learning
Sources: arXiv, Semantic Scholar, Custom URLs
Custom URLs: (5 лучших ссылок)
```

### 4. Экспортируйте результаты
После успешного поиска:
1. Переключитесь на Results
2. Нажмите Export JSON/CSV/NDJSON
3. Сохраните для дальнейшей обработки

## Отладка

### Включите DevTools
1. Нажмите F12 (или Ctrl+Shift+I)
2. Перейдите на вкладку "Console"
3. Ищите логи вроде:
```
Fetching URL: https://...
Content extracted: 1234 characters
Relevance matches: 5
```

### Проверьте Network запросы
1. Откройте DevTools → Network tab
2. Запустите поиск
3. Посмотрите на запросы:
```
https://api.allorigins.win/raw?url=... (CORS proxy)
https://example.com/... (прямой запрос)
```

### Проверьте localStorage
```javascript
// В консоли браузера:
localStorage.getItem('research_documents')
```

## Примеры для тестирования

### Работает хорошо (статические сайты)
```
https://en.wikipedia.org/wiki/Machine_learning
https://github.com/torvalds/linux/blob/master/README.md
https://example.org/about
```

### Могут не работать (динамические)
```
https://twitter.com/username
https://linkedin.com/in/profile
https://medium.com/@author (требует JS)
```

### Рекомендуемые для тестирования
```
# Новости и статьи
https://news.example.com/article
https://blog.company.com/post

# Документация
https://docs.example.com/guide
https://wikipedia.org/wiki/Topic

# GitHub README
https://raw.githubusercontent.com/.../README.md
```

## FAQ

**Q: Почему некоторые URL не загружаются?**
A: Браузерные CORS ограничения. Система пытается использовать прокси, но не все сайты разрешают это.

**Q: Можно ли использовать PDF ссылки?**
A: Нет. Для PDF нужна специальная библиотека (pdf.js). Скоро добавим.

**Q: Как использовать приватные URL?**
A: Невозможно из браузера (нет авторизации). Для production нужен backend.

**Q: Можно ли парсить Pinterest, Instagram и т.д.?**
A: Нет - они требуют авторизацию и блокируют скраппинг.

**Q: Как работает фильтрация по релевантности?**
A: Подсчитываем вхождения ключевых слов. Если ключевых слов нет - пропускаем URL.

## Техническая поддержка

Если что-то не работает:

1. **Проверьте интернет** - откройте URL в браузере напрямую
2. **Очистите консоль** - F12 → Console → Clear console
3. **Попробуйте другой URL** - может быть проблема конкретного сайта
4. **Экспортируйте данные** - перед экспериментами
5. **Перезагрузитесь** - F5 в браузере

---

**Версия**: 1.0
**Дата**: 2026-02-06
**Статус**: Полностью функционально
