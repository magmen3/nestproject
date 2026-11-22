import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'id товара из PostgreSQL' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Отличная книга, читается легко' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ example: ['понятные примеры'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pros?: string[];

  @ApiPropertyOptional({ example: ['мягкая обложка'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cons?: string[];
}
