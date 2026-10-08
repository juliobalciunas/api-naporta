import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { CustomerDto } from './customer.dto';
import { DeliveryAddressDto } from './delivery-address.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: '2026-10-20T18:00:00.000Z', description: 'Nova previsão de entrega' })
  @IsOptional()
  @IsDateString({}, { message: 'A data de previsão de entrega deve estar no formato ISO-8601' })
  estimatedDeliveryDate?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Atualização do status do pedido',
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status inválido. Use PENDING, IN_TRANSIT, DELIVERED ou CANCELLED' })
  status?: OrderStatus;

  @ApiPropertyOptional({ type: () => CustomerDto, description: 'Dados atualizados do cliente' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer?: CustomerDto;

  @ApiPropertyOptional({ type: () => DeliveryAddressDto, description: 'Endereço de entrega atualizado' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional({ type: [CreateOrderItemDto], description: 'Nova lista de itens do pedido' })
  @IsOptional()
  @IsArray({ message: 'Os itens devem ser enviados em formato de lista' })
  @ArrayMinSize(1, { message: 'A lista de itens deve conter ao menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
