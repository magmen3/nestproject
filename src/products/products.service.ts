import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductPageDto } from './dto/product-page.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.categoriesService.findOne(createProductDto.categoryId);
    const savedProduct = await this.productsRepository.save(createProductDto);
    return this.findOne(savedProduct.id);
  }

  async findAll(filter: ProductFilterDto): Promise<ProductPageDto> {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (filter.category) {
      query.andWhere('category.name = :categoryName', {
        categoryName: filter.category,
      });
    }

    if (filter.maxPrice) {
      query.andWhere('product.price <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }

    const sortField = filter.sort ?? 'name';
    query
      .orderBy(`product.${sortField}`, 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total, page: filter.page, limit: filter.limit };
  }

  async findNamesByIds(ids: number[]): Promise<Map<number, string>> {
    const products = await this.productsRepository.findBy({ id: In(ids) });
    const namesById = new Map<number, string>();
    for (const product of products) {
      namesById.set(product.id, product.name);
    }
    return namesById;
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Товар с id ${id} не найден`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    await this.findOne(id);
    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }
    await this.productsRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.productsRepository.delete(id);
  }
}
