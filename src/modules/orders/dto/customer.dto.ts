import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerDto {
  @ApiProperty({ example: 'Ana Beatriz da Silva', description: 'Nome do cliente destinatário' })
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123.456.789-00', description: 'Documento do cliente (CPF ou CNPJ)' })
  @IsNotEmpty({ message: 'O documento do cliente é obrigatório' })
  @IsString()
  document: string;
}
