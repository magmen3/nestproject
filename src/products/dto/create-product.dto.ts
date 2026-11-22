import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Книга «Чистый код»',
    description: 'Название товара',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'books', description: 'Категория товара' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 990, description: 'Цена в рублях, больше нуля' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: true, description: 'Есть ли товар на складе' })
  @IsBoolean()
  inStock: boolean;
}
