import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('naPorta API (e2e)', () => {
  let app: INestApplication;
  const mockOrdersDatabase: any[] = [];
  let adminUser: any;

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.email === 'admin@naporta.com.br' || where.id === 'admin-uuid-1') {
          return Promise.resolve(adminUser);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user-id', ...data });
      }),
    },
    order: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = mockOrdersDatabase.find((o) => o.orderNumber === where.orderNumber);
        return Promise.resolve(found || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const found = mockOrdersDatabase.find(
          (o) => o.id === where.id && (where.deletedAt === null ? !o.deletedAt : true),
        );
        return Promise.resolve(found || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockOrdersDatabase.filter((o) => {
            if (where.deletedAt === null && o.deletedAt) return false;
            if (where.status && o.status !== where.status) return false;
            return true;
          }),
        );
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockOrdersDatabase.filter((o) => (where.deletedAt === null ? !o.deletedAt : true)).length,
        );
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const created = {
          id: 'order-uuid-' + (mockOrdersDatabase.length + 1),
          ...data,
          items: data.items.create.map((item: any, idx: number) => ({
            id: 'item-uuid-' + idx,
            ...item,
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        mockOrdersDatabase.push(created);
        return Promise.resolve(created);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const index = mockOrdersDatabase.findIndex((o) => o.id === where.id);
        if (index === -1) return Promise.resolve(null);
        mockOrdersDatabase[index] = {
          ...mockOrdersDatabase[index],
          ...data,
          updatedAt: new Date(),
        };
        return Promise.resolve(mockOrdersDatabase[index]);
      }),
    },
  };

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('admin123', 10);
    adminUser = {
      id: 'admin-uuid-1',
      name: 'Admin naPorta',
      email: 'admin@naporta.com.br',
      password: passwordHash,
      role: 'ADMIN',
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let jwtToken = '';

  it('/api/auth/login (POST) - deve autenticar e retornar Bearer JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@naporta.com.br',
        password: 'admin123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    jwtToken = response.body.accessToken;
  });

  it('/api/orders (POST) - deve bloquear requisição sem token Bearer (401)', async () => {
    await request(app.getHttpServer()).get('/api/orders').expect(401);
  });

  it('/api/orders (POST) - deve criar um pedido com sucesso quando autenticado', async () => {
    const newOrderPayload = {
      orderNumber: 'NP-E2E-001',
      estimatedDeliveryDate: '2026-10-25T18:00:00.000Z',
      customer: {
        name: 'Cliente E2E Teste',
        document: '999.888.777-66',
      },
      deliveryAddress: {
        zipCode: '05658-000',
        street: 'Rua Principal',
        number: '100',
        neighborhood: 'Paraisópolis',
        city: 'São Paulo',
        state: 'SP',
      },
      items: [
        {
          description: 'Pacote Especial naPorta',
          price: 99.5,
          quantity: 2,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(newOrderPayload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.orderNumber).toBe('NP-E2E-001');
    expect(response.body.customer.name).toBe('Cliente E2E Teste');
    expect(response.body.items).toHaveLength(1);
  });

  it('/api/orders (GET) - deve listar os pedidos criados', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('/api/orders/:id (DELETE) - deve realizar soft delete no pedido', async () => {
    const created = mockOrdersDatabase[0];

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/orders/${created.id}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(deleteResponse.body.message).toContain('exclusão lógica');

    // Tentar buscar o pedido deletado deve retornar 404
    await request(app.getHttpServer())
      .get(`/api/orders/${created.id}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(404);
  });
});
