import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('Категории')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать категорию' })
  @ApiCreatedResponse({ type: Category })
  @ApiConflictResponse({ description: 'Такая категория уже есть' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Список категорий' })
  @ApiOkResponse({ type: [Category] })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('with-products')
  @ApiOperation({
    summary: 'Категории вместе с товарами (один запрос, без N+1)',
  })
  findAllWithProducts() {
    return this.categoriesService.findAllWithProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить категорию по id' })
  @ApiOkResponse({ type: Category })
  @ApiNotFoundResponse({ description: 'Категория не найдена' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }
}
