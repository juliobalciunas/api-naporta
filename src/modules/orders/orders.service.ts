import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber },
    });

    if (existingOrder && !existingOrder.deletedAt) {
      throw new ConflictException(`Já existe um pedido ativo com o número ${dto.orderNumber}`);
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber: dto.orderNumber,
        status: dto.status,
        estimatedDeliveryDate: new Date(dto.estimatedDeliveryDate),
        customerName: dto.customer.name,
        customerDocument: dto.customer.document,
        zipCode: dto.deliveryAddress.zipCode,
        street: dto.deliveryAddress.street,
        number: dto.deliveryAddress.number,
        complement: dto.deliveryAddress.complement,
        neighborhood: dto.deliveryAddress.neighborhood,
        city: dto.deliveryAddress.city,
        state: dto.deliveryAddress.state,
        referencePoint: dto.deliveryAddress.referencePoint,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            price: item.price,
            quantity: item.quantity ?? 1,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return this.formatOrder(order);
  }

  async findAll(filters: FilterOrdersDto) {
    const page = filters.page ? Number(filters.page) : 1;
    const limit = filters.limit ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
    };

    if (filters.orderNumber) {
      where.orderNumber = {
        contains: filters.orderNumber,
        mode: 'insensitive',
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.formatOrder(order)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado ou já excluído');
    }

    return this.formatOrder(order);
  }

  async update(id: string, dto: UpdateOrderDto) {
    const existingOrder = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingOrder) {
      throw new NotFoundException('Pedido não encontrado ou já excluído');
    }

    const data: Prisma.OrderUpdateInput = {};

    if (dto.estimatedDeliveryDate) {
      data.estimatedDeliveryDate = new Date(dto.estimatedDeliveryDate);
    }

    if (dto.status) {
      data.status = dto.status;
    }

    if (dto.customer) {
      if (dto.customer.name) data.customerName = dto.customer.name;
      if (dto.customer.document) data.customerDocument = dto.customer.document;
    }

    if (dto.deliveryAddress) {
      if (dto.deliveryAddress.zipCode) data.zipCode = dto.deliveryAddress.zipCode;
      if (dto.deliveryAddress.street) data.street = dto.deliveryAddress.street;
      if (dto.deliveryAddress.number) data.number = dto.deliveryAddress.number;
      if (dto.deliveryAddress.complement !== undefined) {
        data.complement = dto.deliveryAddress.complement;
      }
      if (dto.deliveryAddress.neighborhood) {
        data.neighborhood = dto.deliveryAddress.neighborhood;
      }
      if (dto.deliveryAddress.city) data.city = dto.deliveryAddress.city;
      if (dto.deliveryAddress.state) data.state = dto.deliveryAddress.state;
      if (dto.deliveryAddress.referencePoint !== undefined) {
        data.referencePoint = dto.deliveryAddress.referencePoint;
      }
    }

    if (dto.items && dto.items.length > 0) {
      data.items = {
        deleteMany: {},
        create: dto.items.map((item) => ({
          description: item.description,
          price: item.price,
          quantity: item.quantity ?? 1,
        })),
      };
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    });

    return this.formatOrder(updated);
  }

  async remove(id: string) {
    const existingOrder = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingOrder) {
      throw new NotFoundException('Pedido não encontrado ou já excluído');
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Pedido excluído com sucesso (exclusão lógica realizada)',
    };
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      customer: {
        name: order.customerName,
        document: order.customerDocument,
      },
      deliveryAddress: {
        zipCode: order.zipCode,
        street: order.street,
        number: order.number,
        complement: order.complement,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
        referencePoint: order.referencePoint,
      },
      items:
        order.items?.map((item: any) => ({
          id: item.id,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
        })) || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
