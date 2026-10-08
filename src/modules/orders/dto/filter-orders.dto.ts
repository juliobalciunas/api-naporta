import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class FilterOrdersDto {
  @ApiPropertyOptional({
    example: 'NP-2026-9812',
    description: 'Filtrar por número do pedido (busca exata ou parcial)',
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({
    example: '2026-10-01T00:00:00.000Z',
    description: 'Data inicial para filtro por período de criação (ISO-8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data inicial deve estar no formato ISO-8601' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31T23:59:59.999Z',
    description: 'Data final para filtro por período de criação (ISO-8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data final deve estar no formato ISO-8601' })
  endDate?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filtrar por status (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status informado é inválido' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Página da paginação',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Quantidade de itens por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
