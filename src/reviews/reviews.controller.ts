import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PublicUser } from '../users/public-user';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductRatingDto } from './dto/product-rating.dto';
import { RatingStatsFilterDto } from './dto/rating-stats-filter.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Отзывы (MongoDB)')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оставить отзыв о товаре' })
  @ApiUnauthorizedResponse({ description: 'Нужно войти' })
  @ApiNotFoundResponse({ description: 'Товар не найден' })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.reviewsService.create(createReviewDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Список отзывов (можно по товару)' })
  findAll(@Query() filter: ReviewFilterDto) {
    return this.reviewsService.findAll(filter);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Рейтинг товаров: средняя оценка и число отзывов (aggregate)',
  })
  @ApiOkResponse({ type: [ProductRatingDto] })
  getRatingStats(@Query() filter: RatingStatsFilterDto) {
    return this.reviewsService.getRatingStats(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Один отзыв' })
  @ApiParam({ name: 'id', example: '6735f0c2a1b2c3d4e5f60718' })
  @ApiNotFoundResponse({ description: 'Отзыв не найден' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменить свой отзыв' })
  @ApiParam({ name: 'id', example: '6735f0c2a1b2c3d4e5f60718' })
  @ApiForbiddenResponse({ description: 'Чужой отзыв' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.reviewsService.update(id, updateReviewDto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой отзыв' })
  @ApiParam({ name: 'id', example: '6735f0c2a1b2c3d4e5f60718' })
  @ApiForbiddenResponse({ description: 'Чужой отзыв' })
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() user: PublicUser,
  ) {
    return this.reviewsService.remove(id, user);
  }
}
