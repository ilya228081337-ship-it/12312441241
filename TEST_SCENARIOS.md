# Тестовые сценарии - Research Information Collector

## Обзор
Документ содержит детальные тестовые сценарии для проверки функциональности системы сбора информации.

## Тест 1: Сбор авторефератов диссертаций (русский + английский)

### Цель
Проверить сбор релевантных научных работ по теме "климат" на русском и английском языках.

### Параметры поиска
```
Keywords: climate change
Date From: 2020-01-01
Date To: 2026-02-01
Languages: Русский, English
Sources: OpenAlex, arXiv, CrossRef, Semantic Scholar
Max Results: 10
```

### Ожидаемый результат
- Минимум 10 документов (могут быть дубликаты из разных источников)
- Документы содержат ключевые слова "climate" или "климат"
- Даты публикации в указанном диапазоне
- Присутствуют документы на обоих языках (если доступны)
- Каждый документ имеет:
  - ✓ title
  - ✓ authors (может быть пустым)
  - ✓ date
  - ✓ url
  - ✓ source
  - ✓ language
  - ✓ abstract (может быть пустым или коротким)
  - ✓ full_text_chunks (минимум 1)

### Критерии качества
1. **Структура данных**: Все поля заполнены согласно типу Document
2. **Релевантность**: Заголовки/аннотации содержат "climate", "change", "климат"
3. **Чанки**: Текст разбит на логические фрагменты ~1000 слов
4. **Без HTML**: Текст очищен от HTML тегов
5. **Без дубликатов**: Нет документов с одинаковым URL

### Шаги выполнения
1. Открыть приложение
2. Ввести параметры поиска
3. Нажать "Start Search"
4. Дождаться завершения (прогресс-бар)
5. Переключиться на вкладку "Results"
6. Проверить количество и качество результатов
7. Развернуть несколько документов для просмотра чанков
8. Экспортировать в JSON и проверить структуру

### Команда для проверки структуры (после экспорта)
```javascript
// В консоли браузера
const docs = JSON.parse(localStorage.getItem('research_documents'));
console.log('Total:', docs.length);
console.log('Sample:', docs[0]);
console.log('Has chunks:', docs[0].full_text_chunks.length > 0);
```

---

## Тест 2: Поиск по интернету - Экономика РФ 2025 (3 языка)

### Цель
Проверить поиск актуальной экономической информации на нескольких языках.

### Параметры поиска
```
Keywords: экономика РФ 2025
Date From: 2025-01-01
Date To: 2026-02-01
Languages: Русский, English, 中文
Sources: OpenAlex, CrossRef, Semantic Scholar
Max Results: 20
```

### Ожидаемый результат
- 20-60 документов (зависит от источников)
- Top-20 результатов наиболее релевантны
- Языки: русский, английский, возможно китайский
- Даты: 2025-2026 год
- Разнообразие источников

### Критерии качества
1. **Без блокировок**: Все API запросы успешны
2. **Рабочие ссылки**: URL доступны (выборочно 5-10)
3. **Временная релевантность**: Даты соответствуют фильтру
4. **Языковая релевантность**: Хотя бы 2 языка представлены
5. **Скорость**: Поиск завершается за 30-60 секунд

### Шаги выполнения
1. Ввести "экономика РФ 2025"
2. Выбрать 3 языка
3. Установить даты 2025-2026
4. Max Results: 20
5. Запустить поиск
6. Засечь время выполнения
7. Проверить статистику по языкам
8. Открыть 5 случайных ссылок
9. Экспортировать в CSV для анализа

### Проверка статистики
```javascript
// В консоли
const stats = JSON.parse(localStorage.getItem('research_documents'))
  .reduce((acc, doc) => {
    acc[doc.language] = (acc[doc.language] || 0) + 1;
    return acc;
  }, {});
console.log('Languages:', stats);
```

---

## Тест 3: Сбор с конкретных сайтов (Custom URLs)

### Цель
Проверить функциональность кастомных URL (с учетом CORS ограничений).

### Параметры поиска
```
Keywords: research
Date From: 2024-01-01
Date To: 2026-02-01
Languages: English
Sources: (отключить все)
Custom URLs:
https://arxiv.org/abs/2401.00001
https://example.org/article
Max Results: 10
```

### Ожидаемый результат
- 2 документа из Custom URLs
- Source: "CustomURL"
- URL сохранены корректно
- Примечание о CORS в abstract

### Критерии качества
1. **Обработка URL**: Каждый URL создает документ
2. **Обработка ошибок**: Недоступные URL не ломают систему
3. **Метаданные**: ID, title, url заполнены

### Шаги выполнения
1. Отключить все источники
2. Ввести Custom URLs (каждый с новой строки)
3. Запустить поиск
4. Проверить количество результатов = количество URL
5. Открыть карточки документов
6. Проверить поле "source"

### Примечание
В браузерной среде Custom URLs работают ограниченно из-за CORS.
Для полной функциональности нужен серверный прокси.

---

## Тест 4: Чистота данных (без HTML мусора)

### Цель
Проверить качество очистки текста от HTML и специальных символов.

### Параметры поиска
```
Keywords: web development
Date From: 2024-01-01
Date To: 2026-02-01
Languages: English
Sources: arXiv, CrossRef
Max Results: 10
```

### Проверка очистки
```javascript
// Экспортировать JSON
const docs = JSON.parse(localStorage.getItem('research_documents'));

// Проверить на HTML теги
const hasHTML = docs.some(doc =>
  /<[^>]+>/.test(doc.title) ||
  /<[^>]+>/.test(doc.abstract)
);
console.log('Has HTML tags:', hasHTML); // должно быть false

// Проверить на HTML entities
const hasEntities = docs.some(doc =>
  /&[a-z]+;/.test(doc.title) ||
  /&[a-z]+;/.test(doc.abstract)
);
console.log('Has HTML entities:', hasEntities); // должно быть false

// Проверить множественные пробелы
const hasMultiSpace = docs.some(doc =>
  /\s{2,}/.test(doc.title) ||
  /\s{2,}/.test(doc.abstract)
);
console.log('Has multiple spaces:', hasMultiSpace); // желательно false
```

### Ожидаемый результат
- Нет HTML тегов (<p>, <div>, etc.)
- Нет HTML entities (&nbsp;, &amp;, etc.)
- Нет множественных пробелов
- Текст читаемый и структурированный

---

## Тест 5: Полнота метаданных

### Цель
Проверить наличие всех необходимых метаданных в документах.

### Параметры поиска
```
Keywords: machine learning
Date From: 2024-01-01
Date To: 2026-02-01
Languages: English
Sources: All
Max Results: 20
```

### Проверка метаданных
```javascript
const docs = JSON.parse(localStorage.getItem('research_documents'));

// Обязательные поля
const required = ['id', 'title', 'authors', 'date', 'url', 'language', 'source', 'abstract', 'full_text_chunks', 'created_at'];

const coverage = docs.map(doc => {
  const missing = required.filter(field => !doc[field] || (Array.isArray(doc[field]) && doc[field].length === 0));
  return {
    url: doc.url,
    missing,
    hasChunks: doc.full_text_chunks?.length > 0
  };
});

console.log('Coverage:', coverage);

// Статистика
console.log('With authors:', docs.filter(d => d.authors.length > 0).length);
console.log('With DOI:', docs.filter(d => d.doi).length);
console.log('With files:', docs.filter(d => d.files?.length > 0).length);
console.log('With chunks:', docs.filter(d => d.full_text_chunks.length > 0).length);
```

### Ожидаемый результат
- 100% документов имеют id, title, url, source
- >80% имеют authors
- >50% имеют DOI (для CrossRef)
- >90% имеют непустые full_text_chunks
- 100% имеют language

---

## Тест 6: Отсутствие дубликатов

### Цель
Проверить что система удаляет дубликаты по URL.

### Параметры поиска
```
Keywords: artificial intelligence
Date From: 2024-01-01
Date To: 2026-02-01
Languages: English
Sources: All (выбрать все 4)
Max Results: 20
```

### Проверка дубликатов
```javascript
const docs = JSON.parse(localStorage.getItem('research_documents'));

// Найти дубликаты
const urls = docs.map(d => d.url);
const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);

console.log('Total documents:', docs.length);
console.log('Unique URLs:', new Set(urls).size);
console.log('Duplicates found:', duplicates.length);
console.log('Duplicate URLs:', duplicates);
```

### Ожидаемый результат
- Количество документов = количество уникальных URL
- duplicates.length === 0
- Даже если разные источники вернули одинаковые документы, они не дублируются

---

## Тест 7: Устойчивость к ошибкам API

### Цель
Проверить что система продолжает работу при сбое одного API.

### Симуляция
1. Отключить интернет на 5 секунд после начала поиска
2. Или использовать некорректные keywords для одного источника

### Параметры поиска
```
Keywords: xyzabcnonexistent123
Date From: 2024-01-01
Date To: 2026-02-01
Languages: English
Sources: All
Max Results: 10
```

### Ожидаемый результат
- Система не падает
- Показывает сообщения о прогрессе
- Возвращает результаты от успешных API
- Логирует ошибки в консоль
- UI остается отзывчивым

### Проверка
```javascript
// В консоли должны быть логи типа:
// "Error searching [Source]: ..."
// Но приложение продолжает работать
```

---

## Тест 8: Экспорт данных (JSON, CSV, NDJSON)

### Цель
Проверить корректность экспорта во всех форматах.

### Подготовка
1. Выполнить любой поиск
2. Получить минимум 10 документов
3. Перейти на вкладку Results

### Шаги тестирования

#### JSON Export
1. Нажать "Export JSON"
2. Открыть файл в текстовом редакторе
3. Проверить валидность JSON (jsonlint.com)
4. Проверить структуру массива объектов

```javascript
// Должен быть массив
Array.isArray(JSON.parse(jsonContent)) === true

// Каждый элемент - объект Document
JSON.parse(jsonContent)[0].hasOwnProperty('id')
```

#### CSV Export
1. Нажать "Export CSV"
2. Открыть в Excel/Google Sheets
3. Проверить заголовки столбцов
4. Проверить кодировку (кириллица корректна)
5. Проверить экранирование (запятые, кавычки)

Ожидаемые столбцы:
```
ID, Title, Authors, Date, DOI, URL, Language, Source, Abstract
```

#### NDJSON Export
1. Нажать "Export NDJSON"
2. Проверить формат: одна строка = один JSON объект
3. Каждая строка должна быть валидным JSON

```bash
# В терминале (если есть jq)
cat export.ndjson | jq . > /dev/null && echo "Valid NDJSON"
```

---

## Тест 9: Работа с большими объемами данных

### Цель
Проверить производительность и ограничения localStorage.

### Параметры поиска
```
Keywords: science
Date From: 2020-01-01
Date To: 2026-02-01
Languages: English
Sources: All
Max Results: 100
```

### Ожидаемый результат
- 100-400 документов (4 источника × 100)
- Система не зависает
- localStorage не переполняется
- UI остается responsive

### Мониторинг localStorage
```javascript
// Проверить размер
const size = new Blob([localStorage.getItem('research_documents')]).size;
console.log('Storage size:', (size / 1024 / 1024).toFixed(2), 'MB');

// Лимит обычно 5-10 MB
if (size > 5 * 1024 * 1024) {
  console.warn('Approaching localStorage limit!');
}
```

### Действия при переполнении
1. Export data
2. Clear All
3. Рекомендация в UI о лимите

---

## Тест 10: Статистика и фильтрация

### Цель
Проверить корректность статистики и фильтров.

### Подготовка
1. Собрать данные из разных источников
2. Минимум 3 языка
3. Минимум 20 документов

### Проверка статистики
1. Нажать "Show Statistics"
2. Проверить подсчет по источникам
3. Проверить подсчет по языкам
4. Проверить подсчет по годам

```javascript
const stats = StorageService.getStatistics();

// Сумма по источникам = total
const totalBySource = Object.values(stats.bySource).reduce((a, b) => a + b, 0);
console.log('Total matches:', totalBySource === stats.total);

// Аналогично для языков
const totalByLang = Object.values(stats.byLanguage).reduce((a, b) => a + b, 0);
console.log('Language total matches:', totalByLang === stats.total);
```

---

## Критерии приёмки (общие)

### Данные чистые
- ✓ Нет HTML тегов
- ✓ Нет лишних пробелов
- ✓ Корректная кодировка (UTF-8)

### Данные полные
- ✓ Все обязательные поля заполнены
- ✓ Метаданные корректны
- ✓ Чанки сгенерированы

### Без дубликатов
- ✓ Один URL = один документ
- ✓ Merge при повторном поиске

### Устойчивость
- ✓ 1-2 сбоя на 100 запросов max
- ✓ Graceful degradation
- ✓ Понятные ошибки пользователю

### Производительность
- ✓ Поиск 20 документов: < 60 сек
- ✓ UI не блокируется
- ✓ Прогресс обновляется

---

## Автоматизированное тестирование

### Пример E2E теста (Cypress)
```javascript
describe('Research Collector E2E', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('should perform full search workflow', () => {
    // Заполнить форму
    cy.get('input[placeholder*="keywords"]').type('climate change');
    cy.contains('English').click();
    cy.contains('OpenAlex').click();

    // Запустить поиск
    cy.contains('Start Search').click();

    // Подождать результатов
    cy.contains('Complete', { timeout: 60000 });

    // Проверить результаты
    cy.contains('Results').click();
    cy.get('[class*="DocumentCard"]').should('have.length.gt', 0);

    // Экспорт
    cy.contains('Export JSON').click();
    cy.readFile('cypress/downloads/research_data_*.json').then((data) => {
      expect(data).to.be.an('array');
      expect(data.length).to.be.gt(0);
    });
  });
});
```

---

## Чек-лист финальной проверки

- [ ] Тест 1: Диссертации (ru+en) ✓
- [ ] Тест 2: Экономика РФ (3 языка) ✓
- [ ] Тест 3: Custom URLs ✓
- [ ] Тест 4: Чистота данных ✓
- [ ] Тест 5: Полнота метаданных ✓
- [ ] Тест 6: Отсутствие дубликатов ✓
- [ ] Тест 7: Устойчивость к ошибкам ✓
- [ ] Тест 8: Экспорт (JSON/CSV/NDJSON) ✓
- [ ] Тест 9: Большие объемы ✓
- [ ] Тест 10: Статистика ✓

---

**Версия:** 1.0
**Статус:** Ready for Testing
**Дата:** 2026-02-06
