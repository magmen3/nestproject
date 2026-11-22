import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoriesRepository.findOneBy({
      name: createCategoryDto.name,
    });
    if (existingCategory) {
      throw new ConflictException(
        `Категория ${createCategoryDto.name} уже существует`,
      );
    }
    return this.categoriesRepository.save(createCategoryDto);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  findAllWithProducts(): Promise<Category[]> {
    return this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product')
      .orderBy('category.name', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Категория с id ${id} не найдена`);
    }
    return category;
  }
}
