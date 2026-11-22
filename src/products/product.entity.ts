import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Книга «Чистый код»' })
  @Column()
  name: string;

  @ApiProperty({ example: 990 })
  @Index()
  @Column({ type: 'integer' })
  price: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  inStock: boolean;

  @ApiProperty({ example: 1 })
  @Column()
  categoryId: number;

  @ApiProperty({ type: () => Category })
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
