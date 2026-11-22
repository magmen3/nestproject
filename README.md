# nestjs-project

Учебный проект по дисциплине «Разработка веб-приложений Backend'а» (NestJS).
Каждая контрольная точка — отдельный коммит и тег: `kt1`, `kt2`, …

## КТ 1 — REST API товаров

| Метод | Путь | Что делает |
|---|---|---|
| POST | `/products` | создать товар |
| GET | `/products` | список товаров, фильтры `?category=books&maxPrice=1000` |
| GET | `/products/:id` | один товар, 404 если нет |
| PATCH | `/products/:id` | изменить переданные поля |
| DELETE | `/products/:id` | удалить (204) |

Пример тела запроса:

```json
{ "name": "Книга", "category": "books", "price": 500, "inStock": true }
```

## КТ 2 — валидация, конфигурация, Swagger

- Глобальный `ValidationPipe` (`whitelist`, `transform`): неверные данные → 400 со списком ошибок, лишние поля отбрасываются.
- DTO проверяются декораторами `class-validator` (`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsPositive`, `@IsBoolean`).
- Настройки — в `.env` через `ConfigModule` (образец — `.env.example`; сам `.env` в git не попадает).
- Документация Swagger: http://localhost:3000/api (JSON-схема — `/api-json`).

## Запуск

```bash
npm install
cp .env.example .env    # и вписать PORT, например 3000
npm run start:dev
npm run test:e2e
```

Порт берётся из `.env` (переменная `PORT`), по умолчанию 3000.
