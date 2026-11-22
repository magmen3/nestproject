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

## Запуск

```bash
npm install
npm run start:dev
npm run test:e2e
```

Порт по умолчанию 3000, другой можно задать переменной `PORT`.
