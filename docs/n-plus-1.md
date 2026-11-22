# Проблема N+1: до и после

Задача: вернуть все категории **вместе с их товарами** (`GET /categories/with-products`).

## До: N+1 запрос

```ts
async findAllWithProducts(): Promise<Category[]> {
  const categories = await this.categoriesRepository.find({
    order: { name: 'ASC' },
  });

  for (const category of categories) {
    category.products = await this.productsRepository.find({
      where: { categoryId: category.id },
    });
  }

  return categories;
}
```

Сначала 1 запрос за списком категорий, потом **по одному запросу на каждую категорию** за её товарами.
Для N категорий получается **N + 1** запрос: 10 категорий → 11 запросов, 1000 категорий → 1001 запрос.
Каждый запрос: отдельная поездка до базы данных, поэтому ответ замедляется пропорционально числу категорий.

## После: 1 запрос с JOIN

```ts
findAllWithProducts(): Promise<Category[]> {
  return this.categoriesRepository
    .createQueryBuilder('category')
    .leftJoinAndSelect('category.products', 'product')
    .orderBy('category.name', 'ASC')
    .addOrderBy('product.name', 'ASC')
    .getMany();
}
```

`leftJoinAndSelect` просит PostgreSQL соединить таблицы `categories` и `products` по внешнему ключу `categoryId`
в **одном** SQL-запросе:

```sql
SELECT category.*, product.*
FROM categories category
LEFT JOIN products product ON product."categoryId" = category.id
ORDER BY category.name ASC, product.name ASC
```

TypeORM сам раскладывает строки результата по объектам: `category.products = [...]`.
`LEFT` JOIN: чтобы категории без товаров тоже попали в ответ (с пустым массивом).

## Замер

База `shop_test`: 10 категорий по 3 товара. Посчитано число SQL-запросов, которые TypeORM отправил в базу.

| Вариант | Запросов к БД |
|---|---|
| До (цикл с `find` для каждой категории) | **11** |
| После (`leftJoinAndSelect`) | **1** |

В проекте используется вариант «после»: `src/categories/categories.service.ts`, метод `findAllWithProducts`.
Тот же приём: в `GET /products`: категория каждого товара подтягивается тем же запросом
(`leftJoinAndSelect('product.category', 'category')`), а не отдельным запросом на каждый товар.
