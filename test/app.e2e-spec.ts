import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

process.env.DB_NAME = 'shop_test';

describe('Магазин: категории и товары', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    setupApp(app);
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE products, categories RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  function api() {
    return request(app.getHttpServer());
  }

  async function createCategory(name: string) {
    await api().post('/categories').send({ name }).expect(201);
  }

  async function createProduct(
    name: string,
    price: number,
    categoryId: number,
  ) {
    await api()
      .post('/products')
      .send({ name, price, inStock: true, categoryId })
      .expect(201);
  }

  async function fillShop() {
    await createCategory('books');
    await createCategory('electronics');
    await createProduct('Телефон', 20000, 2);
    await createProduct('Наушники', 3000, 2);
    await createProduct('Книга', 500, 1);
    await createProduct('Альбом', 700, 1);
    await createProduct('Журнал', 200, 1);
  }

  it('POST /products сохраняет товар в базу и возвращает его с категорией', async () => {
    await createCategory('books');

    const response = await api()
      .post('/products')
      .send({ name: 'Книга', price: 500, inStock: true, categoryId: 1 })
      .expect(201);

    expect(response.body).toEqual({
      id: 1,
      name: 'Книга',
      price: 500,
      inStock: true,
      categoryId: 1,
      category: { id: 1, name: 'books' },
    });
  });

  it('товар с несуществующей категорией: 404', async () => {
    await api()
      .post('/products')
      .send({ name: 'Книга', price: 500, inStock: true, categoryId: 99 })
      .expect(404);
  });

  it('повторная категория: 409', async () => {
    await createCategory('books');
    await api().post('/categories').send({ name: 'books' }).expect(409);
  });

  it('GET /products: фильтр по категории (join), цене и сортировка по цене', async () => {
    await fillShop();

    const response = await api()
      .get('/products?category=books&maxPrice=600&sort=price')
      .expect(200);

    expect(response.body).toMatchObject({
      total: 2,
      page: 1,
      limit: 10,
      items: [
        { name: 'Журнал', price: 200, category: { name: 'books' } },
        { name: 'Книга', price: 500, category: { name: 'books' } },
      ],
    });
  });

  it('GET /products: пагинация page и limit', async () => {
    await fillShop();

    const firstPage = await api()
      .get('/products?sort=price&page=1&limit=2')
      .expect(200);
    const secondPage = await api()
      .get('/products?sort=price&page=2&limit=2')
      .expect(200);

    expect(firstPage.body).toMatchObject({
      total: 5,
      page: 1,
      limit: 2,
      items: [{ name: 'Журнал' }, { name: 'Книга' }],
    });
    expect(secondPage.body).toMatchObject({
      total: 5,
      page: 2,
      items: [{ name: 'Альбом' }, { name: 'Наушники' }],
    });
  });

  it('неверные параметры списка: 400', async () => {
    await api().get('/products?page=0').expect(400);
    await api().get('/products?limit=500').expect(400);
    await api().get('/products?sort=password').expect(400);
  });

  it('GET /categories/with-products: категории вместе с товарами', async () => {
    await fillShop();

    const response = await api().get('/categories/with-products').expect(200);

    expect(response.body).toMatchObject([
      {
        name: 'books',
        products: [{ name: 'Альбом' }, { name: 'Журнал' }, { name: 'Книга' }],
      },
      {
        name: 'electronics',
        products: [{ name: 'Наушники' }, { name: 'Телефон' }],
      },
    ]);
  });

  it('PATCH и DELETE работают с базой, 404 для отсутствующего товара', async () => {
    await fillShop();

    const updated = await api()
      .patch('/products/1')
      .send({ price: 18000 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: 1, price: 18000 });

    await api().delete('/products/1').expect(204);
    await api().get('/products/1').expect(404);
    await api().delete('/products/1').expect(404);
  });

  it('валидация по-прежнему работает: 400', async () => {
    await api()
      .post('/products')
      .send({ name: '', price: 10.5, inStock: 'да', categoryId: 'books' })
      .expect(400);
  });
});
