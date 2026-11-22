import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
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

  @ApiProperty({
    example: 990,
    description: 'Цена в рублях, целое число больше нуля',
  })
  @IsInt()
  @IsPositive()
  price: number;

  @ApiProperty({ example: true, description: 'Есть ли товар на складе' })
  @IsBoolean()
  inStock: boolean;

  @ApiProperty({ example: 1, description: 'id категории' })
  @IsInt()
  @IsPositive()
  categoryId: number;
}
