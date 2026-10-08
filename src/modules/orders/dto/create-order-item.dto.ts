import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Tênis Esportivo Running Pro', description: 'Descrição do item do pedido' })
  @IsNotEmpty({ message: 'A descrição do item é obrigatória' })
  @IsString()
  description: string;

  @ApiProperty({ example: 219.9, description: 'Preço unitário do item' })
  @IsNotEmpty({ message: 'O preço do item é obrigatório' })
  @IsNumber({}, { message: 'O preço deve ser numérico' })
  @IsPositive({ message: 'O preço deve ser maior que zero' })
  price: number;

  @ApiPropertyOptional({ example: 1, description: 'Quantidade do item', default: 1 })
  @IsOptional()
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade mínima permitida é 1' })
  quantity?: number;
}
