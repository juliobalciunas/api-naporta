import { PrismaClient, OrderStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados naPorta...');

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador naPorta',
      email: 'admin@naporta.com.br',
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Usuario administrador criado: ${admin.email} / senha: admin123`);

  const now = new Date();

  const ordersData = [
    {
      orderNumber: 'NP-2026-1001',
      status: OrderStatus.DELIVERED,
      estimatedDeliveryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      customerName: 'Ana Beatriz da Silva',
      customerDocument: '123.456.789-10',
      zipCode: '05658-000',
      street: 'Rua Pasquale Gallupi',
      number: '450',
      complement: 'Bloco C, Apto 12',
      neighborhood: 'Paraisópolis',
      city: 'São Paulo',
      state: 'SP',
      referencePoint: 'Ao lado da mercearia do Seu Zé',
      items: [
        { description: 'Tênis Running Ultralight Pro', price: 249.9, quantity: 1 },
        { description: 'Meia Esportiva Cano Médio (Kit 3 pares)', price: 39.9, quantity: 2 },
      ],
    },
    {
      orderNumber: 'NP-2026-1002',
      status: OrderStatus.IN_TRANSIT,
      estimatedDeliveryDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      customerName: 'Carlos Eduardo Souza',
      customerDocument: '234.567.890-21',
      zipCode: '21073-000',
      street: 'Travessa da Esperança',
      number: '88',
      complement: 'Fundos',
      neighborhood: 'Complexo do Alemão',
      city: 'Rio de Janeiro',
      state: 'RJ',
      referencePoint: 'Subida da grota, portão verde',
      items: [
        { description: 'Smartphone Galaxy A15 128GB', price: 899.0, quantity: 1 },
        { description: 'Capa Protetora Anti-impacto', price: 45.0, quantity: 1 },
      ],
    },
    {
      orderNumber: 'NP-2026-1003',
      status: OrderStatus.PENDING,
      estimatedDeliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      customerName: 'Mariana Oliveira Costa',
      customerDocument: '345.678.901-32',
      zipCode: '04235-000',
      street: 'Estrada das Lágrimas',
      number: '1500',
      complement: 'Bloco 4, Apto 22',
      neighborhood: 'Heliópolis',
      city: 'São Paulo',
      state: 'SP',
      referencePoint: 'Próximo ao CEU Heliópolis',
      items: [{ description: 'Cafeteira Elétrica Express 110V', price: 159.9, quantity: 1 }],
    },
    {
      orderNumber: 'NP-2026-1004',
      status: OrderStatus.IN_TRANSIT,
      estimatedDeliveryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      customerName: 'Lucas Fernandes Rocha',
      customerDocument: '456.789.012-43',
      zipCode: '22450-240',
      street: 'Estrada da Gávea',
      number: '320',
      complement: null,
      neighborhood: 'Rocinha',
      city: 'Rio de Janeiro',
      state: 'RJ',
      referencePoint: 'Curva do S, próximo à passarela',
      items: [
        { description: 'Mochila Impermeável para Notebook', price: 129.9, quantity: 1 },
        { description: 'Garrafa Térmica Inox 750ml', price: 69.9, quantity: 1 },
      ],
    },
    {
      orderNumber: 'NP-2026-1005',
      status: OrderStatus.CANCELLED,
      estimatedDeliveryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      customerName: 'Juliana Mendes Ramos',
      customerDocument: '567.890.123-54',
      zipCode: '22770-000',
      street: 'Rua Daniel',
      number: '42',
      complement: null,
      neighborhood: 'Cidade de Deus',
      city: 'Rio de Janeiro',
      state: 'RJ',
      referencePoint: 'Esquina com a praça comunitária',
      items: [{ description: 'Fones de Ouvido Bluetooth TWS', price: 119.0, quantity: 1 }],
    },
    {
      orderNumber: 'NP-2026-1006',
      status: OrderStatus.PENDING,
      estimatedDeliveryDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      deletedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      customerName: 'Roberto Alcantara Pinto',
      customerDocument: '678.901.234-65',
      zipCode: '72236-800',
      street: 'Trecho 2, Conjunto B',
      number: '15',
      complement: 'Casa 2',
      neighborhood: 'Sol Nascente',
      city: 'Ceilândia',
      state: 'DF',
      referencePoint: 'Atrás da parada de ônibus principal',
      items: [{ description: 'Relógio Smartwatch Fit 2', price: 189.9, quantity: 1 }],
    },
  ];

  for (const order of ordersData) {
    const { items, ...orderData } = order;
    await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
    });
  }

  console.log(`${ordersData.length} pedidos ficticios semeados com sucesso.`);
  console.log('Seed finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro durante execucao do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
