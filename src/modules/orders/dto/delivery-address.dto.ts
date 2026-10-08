import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeliveryAddressDto {
  @ApiProperty({ example: '05658-000', description: 'CEP da localidade' })
  @IsNotEmpty({ message: 'O CEP é obrigatório' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'Rua Pasquale Gallupi', description: 'Logradouro / Rua / Travessa' })
  @IsNotEmpty({ message: 'A rua é obrigatória' })
  @IsString()
  street: string;

  @ApiProperty({ example: '450', description: 'Número do endereço' })
  @IsNotEmpty({ message: 'O número é obrigatório' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'Bloco C, Apto 12', description: 'Complemento do endereço' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Paraisópolis', description: 'Bairro / Comunidade' })
  @IsNotEmpty({ message: 'O bairro é obrigatório' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade' })
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'SP', description: 'Estado (UF)' })
  @IsNotEmpty({ message: 'O estado é obrigatório' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'Próximo ao Hub comunitário naPorta', description: 'Ponto de referência' })
  @IsOptional()
  @IsString()
  referencePoint?: string;
}
