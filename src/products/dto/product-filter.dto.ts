import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString } from 'class-validator';

export class ProductFilterDto {
  @ApiPropertyOptional({
    example: 'books',
    description: 'Только эта категория',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Не дороже этой цены' })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  maxPrice?: number;
}
