import { ApiProperty } from '@nestjs/swagger';

export class Product {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Книга «Чистый код»' })
  name: string;

  @ApiProperty({ example: 'books' })
  category: string;

  @ApiProperty({ example: 990 })
  price: number;

  @ApiProperty({ example: true })
  inStock: boolean;
}
