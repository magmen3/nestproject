import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product';
import { ProductsService } from './products.service';

@ApiTags('Товары')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать товар' })
  @ApiCreatedResponse({ type: Product })
  @ApiBadRequestResponse({ description: 'Данные не прошли проверку' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Список товаров с фильтрами' })
  @ApiOkResponse({ type: [Product] })
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить товар по id' })
  @ApiOkResponse({ type: Product })
  @ApiNotFoundResponse({ description: 'Товар не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить товар' })
  @ApiOkResponse({ type: Product })
  @ApiNotFoundResponse({ description: 'Товар не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить товар' })
  @ApiNoContentResponse({ description: 'Товар удалён' })
  @ApiNotFoundResponse({ description: 'Товар не найден' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.productsService.remove(id);
  }
}
