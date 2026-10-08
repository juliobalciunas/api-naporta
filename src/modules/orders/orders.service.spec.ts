import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  const mockOrder = {
    id: 'uuid-order-1',
    orderNumber: 'NP-2026-9001',
    status: OrderStatus.PENDING,
    estimatedDeliveryDate: new Date('2026-10-15T00:00:00.000Z'),
    customerName: 'Maria Silva',
    customerDocument: '111.222.333-44',
    zipCode: '05658-000',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 1',
    neighborhood: 'Paraisópolis',
    city: 'São Paulo',
    state: 'SP',
    referencePoint: 'Próximo à padaria',
    createdAt: new Date('2026-10-08T00:00:00.000Z'),
    updatedAt: new Date('2026-10-08T00:00:00.000Z'),
    deletedAt: null,
    items: [
      {
        id: 'uuid-item-1',
        orderId: 'uuid-order-1',
        description: 'Tênis Esportivo',
        price: 199.9,
        quantity: 1,
      },
    ],
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um novo pedido com sucesso', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue(mockOrder);

      const createDto = {
        orderNumber: 'NP-2026-9001',
        estimatedDeliveryDate: '2026-10-15T00:00:00.000Z',
        customer: {
          name: 'Maria Silva',
          document: '111.222.333-44',
        },
        deliveryAddress: {
          zipCode: '05658-000',
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 1',
          neighborhood: 'Paraisópolis',
          city: 'São Paulo',
          state: 'SP',
          referencePoint: 'Próximo à padaria',
        },
        items: [
          {
            description: 'Tênis Esportivo',
            price: 199.9,
            quantity: 1,
          },
        ],
      };

      const result = await service.create(createDto);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: 'NP-2026-9001' },
      });
      expect(prisma.order.create).toHaveBeenCalled();
      expect(result.orderNumber).toBe('NP-2026-9001');
      expect(result.customer.name).toBe('Maria Silva');
      expect(result.items).toHaveLength(1);
    });

    it('deve lançar ConflictException se o número do pedido já estiver cadastrado e ativo', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const createDto = {
        orderNumber: 'NP-2026-9001',
        estimatedDeliveryDate: '2026-10-15T00:00:00.000Z',
        customer: { name: 'Maria', document: '111' },
        deliveryAddress: {
          zipCode: '000',
          street: 'Rua',
          number: '1',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'UF',
        },
        items: [{ description: 'Item', price: 10, quantity: 1 }],
      };

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('deve listar pedidos filtrando por status e garantindo exclusão lógica (deletedAt: null)', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll({ status: OrderStatus.PENDING, page: 1, limit: 10 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            status: OrderStatus.PENDING,
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar detalhes do pedido encontrado', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findOne('uuid-order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-order-1', deletedAt: null },
        include: { items: true },
      });
      expect(result.id).toBe('uuid-order-1');
    });

    it('deve lançar NotFoundException quando o pedido não existir ou estiver excluído', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um pedido existente', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.IN_TRANSIT,
      });

      const result = await service.update('uuid-order-1', { status: OrderStatus.IN_TRANSIT });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-order-1' },
          data: expect.objectContaining({ status: OrderStatus.IN_TRANSIT }),
        }),
      );
      expect(result.status).toBe(OrderStatus.IN_TRANSIT);
    });

    it('deve lançar NotFoundException ao tentar editar pedido excluído ou inexistente', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.update('id-inexistente', { status: OrderStatus.DELIVERED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('deve realizar exclusão lógica atualizando deletedAt', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        deletedAt: new Date(),
      });

      const result = await service.remove('uuid-order-1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'uuid-order-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.message).toContain('exclusão lógica realizada');
    });

    it('deve lançar NotFoundException se o pedido já estiver excluído', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.remove('uuid-order-ja-deletado')).rejects.toThrow(NotFoundException);
    });
  });
});
