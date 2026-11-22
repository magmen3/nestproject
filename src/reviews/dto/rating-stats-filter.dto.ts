import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RatingStatsFilterDto {
  @ApiPropertyOptional({
    example: 4,
    description: 'Учитывать только отзывы с оценкой не ниже этой',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;
}
