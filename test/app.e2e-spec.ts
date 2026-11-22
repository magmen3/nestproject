import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

describe('Товары /products', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const phone = {
    name: 'Телефон',
    category: 'electronics',
    price: 20000,
    inStock: true,
  };
  const book = { name: 'Книга', category: 'books', price: 500, inStock: true };

  it('POST создаёт товар с id', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .send(phone)
      .expect(201);

    expect(response.body).toEqual({ id: 1, ...phone });
  });

  it('GET возвращает список и фильтрует по category и maxPrice', async () => {
    await request(app.getHttpServer()).post('/products').send(phone);
    await request(app.getHttpServer()).post('/products').send(book);

    const all = await request(app.getHttpServer()).get('/products').expect(200);
    expect(all.body).toHaveLength(2);

    const books = await request(app.getHttpServer())
      .get('/products?category=books')
      .expect(200);
    expect(books.body).toEqual([{ id: 2, ...book }]);

    const cheap = await request(app.getHttpServer())
      .get('/products?maxPrice=1000')
      .expect(200);
    expect(cheap.body).toEqual([{ id: 2, ...book }]);
  });

  it('GET /:id возвращает товар, а несуществующий — 404', async () => {
    await request(app.getHttpServer()).post('/products').send(phone);

    await request(app.getHttpServer()).get('/products/1').expect(200);
    const notFound = await request(app.getHttpServer())
      .get('/products/99')
      .expect(404);
    expect(notFound.body).toMatchObject({
      message: 'Товар с id 99 не найден',
    });
  });

  it('PATCH обновляет только переданные поля', async () => {
    await request(app.getHttpServer()).post('/products').send(phone);

    const response = await request(app.getHttpServer())
      .patch('/products/1')
      .send({ price: 18000 })
      .expect(200);

    expect(response.body).toEqual({ id: 1, ...phone, price: 18000 });
  });

  it('DELETE удаляет товар, повторное удаление — 404', async () => {
    await request(app.getHttpServer()).post('/products').send(phone);

    await request(app.getHttpServer()).delete('/products/1').expect(204);
    await request(app.getHttpServer()).get('/products/1').expect(404);
    await request(app.getHttpServer()).delete('/products/1').expect(404);
  });

  it('POST с неверными данными — 400 и список ошибок', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .send({ name: '', category: 'books', price: -5, inStock: 'да' })
      .expect(400);

    expect(response.body).toMatchObject({
      message: expect.arrayContaining([
        'name should not be empty',
        'price must be a positive number',
        'inStock must be a boolean value',
      ]) as unknown,
    });
  });

  it('лишние поля отбрасываются (whitelist)', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .send({ ...book, isAdmin: true })
      .expect(201);

    expect(response.body).toEqual({ id: 1, ...book });
  });

  it('PATCH с неверной ценой — 400', async () => {
    await request(app.getHttpServer()).post('/products').send(book);

    await request(app.getHttpServer())
      .patch('/products/1')
      .send({ price: 'дёшево' })
      .expect(400);
  });

  it('maxPrice в query должен быть положительным числом', async () => {
    await request(app.getHttpServer())
      .get('/products?maxPrice=abc')
      .expect(400);
  });

  it('Swagger-документация доступна по /api-json', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);

    expect(response.body).toMatchObject({
      info: { title: 'NestJS Project API' },
    });
  });
});
