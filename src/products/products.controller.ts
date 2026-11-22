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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductPageDto } from './dto/product-page.dto';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

@ApiTags('Товары')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Нет токена' })
  @ApiForbiddenResponse({ description: 'Нужна роль admin' })
  @ApiOperation({ summary: 'Создать товар' })
  @ApiCreatedResponse({ type: Product })
  @ApiBadRequestResponse({ description: 'Данные не прошли проверку' })
  @ApiNotFoundResponse({ description: 'Категория не найдена' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Список товаров: фильтры, сортировка, страницы',
  })
  @ApiOkResponse({ type: ProductPageDto })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Нет токена' })
  @ApiForbiddenResponse({ description: 'Нужна роль admin' })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Нет токена' })
  @ApiForbiddenResponse({ description: 'Нужна роль admin' })
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить товар' })
  @ApiNoContentResponse({ description: 'Товар удалён' })
  @ApiNotFoundResponse({ description: 'Товар не найден' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
