import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

export class ProductFilterDto {
  @ApiPropertyOptional({
    example: 'books',
    description: 'Только товары этой категории (по названию)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Не дороже этой цены' })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 'price',
    enum: ['price', 'name'],
    description: 'Поле сортировки',
  })
  @IsOptional()
  @IsIn(['price', 'name'])
  sort?: 'price' | 'name';

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Номер страницы',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Товаров на странице (до 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit: number = 10;
}
