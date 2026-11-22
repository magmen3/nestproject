import { ApiProperty } from '@nestjs/swagger';

export class ProductRatingDto {
  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Книга «Чистый код»' })
  productName: string;

  @ApiProperty({ example: 4.5 })
  averageRating: number;

  @ApiProperty({ example: 12 })
  reviewsCount: number;
}
