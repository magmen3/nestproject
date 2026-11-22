# nestjs-project

Учебный проект по дисциплине «Разработка веб-приложений Backend'а» (NestJS).
Каждая контрольная точка: отдельный коммит и тег: `kt1`, `kt2`, …

## КТ 1: REST API товаров (в КТ 3 поле `category` заменено на `categoryId`)

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

## КТ 2: валидация, конфигурация, Swagger

- Глобальный `ValidationPipe` (`whitelist`, `transform`): неверные данные → 400 со списком ошибок, лишние поля отбрасываются.
- DTO проверяются декораторами `class-validator` (`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsPositive`, `@IsBoolean`).
- Настройки: в `.env` через `ConfigModule` (образец: `.env.example`; сам `.env` в git не попадает).
- Документация Swagger: http://localhost:3000/api (JSON-схема: `/api-json`).

## КТ 3: PostgreSQL и TypeORM

- PostgreSQL в Docker (`docker-compose.yml`, порт **5434**), подключение через TypeORM, `synchronize: false`.
- Структура базы: только миграциями (`src/database/migrations`).
- Связь **категория 1: N товары**: внешний ключ `products.categoryId → categories.id`.
- `GET /products` построен на QueryBuilder: `leftJoinAndSelect` (категория), фильтры `category`, `maxPrice`,
  сортировка `sort=price|name`, пагинация `page`, `limit` → ответ `{ items, total, page, limit }`.
- `GET /categories/with-products`: категории с товарами одним запросом. Разбор N+1 «до/после»: [docs/n-plus-1.md](docs/n-plus-1.md).

| Метод | Путь | Что делает |
|---|---|---|
| POST | `/categories` | создать категорию (409, если такая уже есть) |
| GET | `/categories` | список категорий |
| GET | `/categories/with-products` | категории вместе с товарами |
| GET | `/categories/:id` | одна категория |

Тело товара теперь содержит `categoryId` вместо `category`:

```json
{ "name": "Книга", "price": 500, "inStock": true, "categoryId": 1 }
```

## КТ 4: аутентификация JWT

- `POST /auth/register`: регистрация (роль `user`). Пароль хешируется **bcrypt** (в базе строка `$2b$10$...`).
- `POST /auth/login`: Passport **LocalStrategy** проверяет пароль через `bcrypt.compare` → `{ accessToken }` (JWT). Неверный пароль → 401.
- `GET /auth/profile`: защищён `JwtAuthGuard`: без токена → 401.
- Изменение каталога (`POST/PATCH/DELETE /products`, `POST /categories`): только роль `admin`
  (`JwtAuthGuard` + `RolesGuard` + `@Roles(Role.Admin)`): без токена → 401, роль `user` → 403. Чтение: без токена.
- Пароль и его хеш не попадают ни в ответы, ни в JWT-payload (`{ sub, email, role }`), ни в `req.user`.
- Администратор: `npm run admin:create` (берёт `ADMIN_EMAIL` и `ADMIN_PASSWORD` из `.env`).
- В Swagger: кнопка **Authorize** → вставить токен.

## КТ 5: MongoDB вместе с PostgreSQL

- MongoDB в Docker (`mongo:7`, порт 27017), подключение `MongooseModule.forRootAsync`, адрес: `MONGODB_URI` в `.env`.
- Отзывы о товарах: Mongoose-схема `Review` (`@Schema`, `@Prop`, `SchemaFactory.createForClass`).
- CRUD через Model: `find`, `findById`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`.
- Агрегация `GET /reviews/stats`: `$match` (оценка не ниже `minRating`) → `$group` (средняя оценка и число отзывов по товару) → `$sort`.
  Названия товаров подтягиваются из PostgreSQL одним запросом.
- Обе базы работают одновременно: каталог и пользователи: PostgreSQL (TypeORM), отзывы: MongoDB (Mongoose).
  Почему так: [docs/why-mongodb.md](docs/why-mongodb.md).

| Метод | Путь | Доступ | Что делает |
|---|---|---|---|
| POST | `/reviews` | с токеном | оставить отзыв (товар должен существовать) |
| GET | `/reviews?productId=1` | все | список отзывов |
| GET | `/reviews/stats?minRating=4` | все | рейтинг товаров (aggregate) |
| GET | `/reviews/:id` | все | один отзыв |
| PATCH | `/reviews/:id` | автор или admin | изменить |
| DELETE | `/reviews/:id` | автор или admin | удалить |

## Запуск

```bash
npm install
cp .env.example .env    # вписать значения (пример ниже)
npm run db:up           # PostgreSQL и MongoDB в Docker
npm run migration:run   # создать таблицы
npm run admin:create    # создать администратора
npm run start:dev
npm run test:e2e
```

Пример `.env`:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5434
DB_USER=shop
DB_PASSWORD=shop_password
DB_NAME=shop
JWT_SECRET=длинная-случайная-строка
JWT_EXPIRES_IN_SECONDS=3600
ADMIN_EMAIL=admin@shop.local
ADMIN_PASSWORD=adminPassword123
MONGODB_URI=mongodb://localhost:27017/shop
```

Тесты используют отдельные базы `shop_test` в PostgreSQL и MongoDB.

Новая миграция после изменения сущностей: `npm run migration:generate -- src/database/migrations/ИмяМиграции`.
