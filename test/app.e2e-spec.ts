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
  let adminToken: string;

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
      'TRUNCATE products, categories, users RESTART IDENTITY CASCADE',
    );
    adminToken = await createAdminAndLogin();
  });

  afterAll(async () => {
    await app.close();
  });

  function api() {
    return request(app.getHttpServer());
  }

  async function registerUser(email: string, password: string) {
    await api().post('/auth/register').send({ email, password }).expect(201);
  }

  async function login(email: string, password: string): Promise<string> {
    const response = await api()
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (response.body as { accessToken: string }).accessToken;
  }

  async function createAdminAndLogin(): Promise<string> {
    await registerUser('admin@shop.local', 'adminPassword123');
    await dataSource.query(
      "UPDATE users SET role = 'admin' WHERE email = 'admin@shop.local'",
    );
    return login('admin@shop.local', 'adminPassword123');
  }

  function readJwtPayload(token: string): Record<string, unknown> {
    const payloadPart = token.split('.')[1];
    return JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  }

  async function createCategory(name: string) {
    await api()
      .post('/categories')
      .auth(adminToken, { type: 'bearer' })
      .send({ name })
      .expect(201);
  }

  async function createProduct(
    name: string,
    price: number,
    categoryId: number,
  ) {
    await api()
      .post('/products')
      .auth(adminToken, { type: 'bearer' })
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
      .auth(adminToken, { type: 'bearer' })
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
      .auth(adminToken, { type: 'bearer' })
      .send({ name: 'Книга', price: 500, inStock: true, categoryId: 99 })
      .expect(404);
  });

  it('повторная категория: 409', async () => {
    await createCategory('books');
    await api()
      .post('/categories')
      .auth(adminToken, { type: 'bearer' })
      .send({ name: 'books' })
      .expect(409);
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
      .auth(adminToken, { type: 'bearer' })
      .send({ price: 18000 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: 1, price: 18000 });

    await api()
      .delete('/products/1')
      .auth(adminToken, { type: 'bearer' })
      .expect(204);
    await api().get('/products/1').expect(404);
    await api()
      .delete('/products/1')
      .auth(adminToken, { type: 'bearer' })
      .expect(404);
  });

  it('валидация по-прежнему работает: 400', async () => {
    await api()
      .post('/products')
      .auth(adminToken, { type: 'bearer' })
      .send({ name: '', price: 10.5, inStock: 'да', categoryId: 'books' })
      .expect(400);
  });

  describe('Аутентификация и авторизация', () => {
    it('регистрация: пароль хранится как bcrypt-хеш, в ответе нет пароля', async () => {
      const response = await api()
        .post('/auth/register')
        .send({ email: 'ivan@example.com', password: 'ivanPassword1' })
        .expect(201);

      expect(response.body).toEqual({
        id: 2,
        email: 'ivan@example.com',
        role: 'user',
      });

      const rows: { passwordHash: string }[] = await dataSource.query(
        'SELECT "passwordHash" FROM users WHERE email = $1',
        ['ivan@example.com'],
      );
      expect(rows[0].passwordHash).toMatch(/^\$2b\$10\$/);
      expect(rows[0].passwordHash).not.toContain('ivanPassword1');
    });

    it('повторная регистрация: 409, неверные данные: 400', async () => {
      await registerUser('ivan@example.com', 'ivanPassword1');

      await api()
        .post('/auth/register')
        .send({ email: 'ivan@example.com', password: 'otherPassword1' })
        .expect(409);
      await api()
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'ivanPassword1' })
        .expect(400);
      await api()
        .post('/auth/register')
        .send({ email: 'petr@example.com', password: 'short' })
        .expect(400);
    });

    it('вход: верный пароль: токен без пароля и хеша, неверный: 401', async () => {
      await registerUser('ivan@example.com', 'ivanPassword1');

      const token = await login('ivan@example.com', 'ivanPassword1');
      const payload = readJwtPayload(token);
      expect(payload).toMatchObject({
        sub: 2,
        email: 'ivan@example.com',
        role: 'user',
      });
      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('passwordHash');

      await api()
        .post('/auth/login')
        .send({ email: 'ivan@example.com', password: 'wrongPassword' })
        .expect(401);
      await api()
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'ivanPassword1' })
        .expect(401);
    });

    it('профиль: без токена: 401, с токеном: данные без хеша', async () => {
      await registerUser('ivan@example.com', 'ivanPassword1');
      const token = await login('ivan@example.com', 'ivanPassword1');

      await api().get('/auth/profile').expect(401);
      await api()
        .get('/auth/profile')
        .auth('broken.token.value', { type: 'bearer' })
        .expect(401);

      const response = await api()
        .get('/auth/profile')
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(response.body).toEqual({
        id: 2,
        email: 'ivan@example.com',
        role: 'user',
      });
    });

    it('создание товара: без токена: 401, роль user: 403, admin: 201', async () => {
      await createCategory('books');
      await registerUser('ivan@example.com', 'ivanPassword1');
      const userToken = await login('ivan@example.com', 'ivanPassword1');
      const newProduct = {
        name: 'Книга',
        price: 500,
        inStock: true,
        categoryId: 1,
      };

      await api().post('/products').send(newProduct).expect(401);
      await api()
        .post('/products')
        .auth(userToken, { type: 'bearer' })
        .send(newProduct)
        .expect(403);
      await api()
        .post('/products')
        .auth(adminToken, { type: 'bearer' })
        .send(newProduct)
        .expect(201);
    });

    it('чтение товаров доступно без токена', async () => {
      await api().get('/products').expect(200);
      await api().get('/categories').expect(200);
    });
  });
});
