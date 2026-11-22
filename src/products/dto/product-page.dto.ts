import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product.entity';

export class ProductPageDto {
  @ApiProperty({ type: [Product] })
  items: Product[];

  @ApiProperty({
    example: 25,
    description: 'Сколько всего товаров подходит под фильтр',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
