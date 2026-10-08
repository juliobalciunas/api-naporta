import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { CustomerDto } from './customer.dto';
import { DeliveryAddressDto } from './delivery-address.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'NP-2026-9812', description: 'Número identificador único do pedido' })
  @IsNotEmpty({ message: 'O número do pedido é obrigatório' })
  @IsString()
  orderNumber: string;

  @ApiProperty({ example: '2026-10-15T18:00:00.000Z', description: 'Data prevista para entrega' })
  @IsNotEmpty({ message: 'A data prevista de entrega é obrigatória' })
  @IsDateString({}, { message: 'A data de previsão de entrega deve estar no formato ISO-8601' })
  estimatedDeliveryDate: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    description: 'Status do pedido (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status inválido. Use PENDING, IN_TRANSIT, DELIVERED ou CANCELLED' })
  status?: OrderStatus;

  @ApiProperty({ type: () => CustomerDto, description: 'Dados do cliente destinatário' })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ type: () => DeliveryAddressDto, description: 'Endereço de entrega' })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Itens inclusos no pedido' })
  @IsArray({ message: 'Os itens devem ser enviados em uma lista' })
  @ArrayMinSize(1, { message: 'O pedido deve conter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
