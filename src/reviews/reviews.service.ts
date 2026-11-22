import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { PublicUser } from '../users/public-user';
import { Role } from '../users/role';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductRatingDto } from './dto/product-rating.dto';
import { RatingStatsFilterDto } from './dto/rating-stats-filter.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review, ReviewDocument } from './review.schema';

interface RatingGroup {
  _id: number;
  averageRating: number;
  reviewsCount: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<Review>,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    author: PublicUser,
  ): Promise<ReviewDocument> {
    await this.productsService.findOne(createReviewDto.productId);
    return this.reviewModel.create({
      ...createReviewDto,
      authorId: author.id,
      authorEmail: author.email,
    });
  }

  findAll(filter: ReviewFilterDto): Promise<ReviewDocument[]> {
    const condition = filter.productId ? { productId: filter.productId } : {};
    return this.reviewModel.find(condition).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: Types.ObjectId): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException(`Отзыв ${id.toString()} не найден`);
    }
    return review;
  }

  async update(
    id: Types.ObjectId,
    updateReviewDto: UpdateReviewDto,
    user: PublicUser,
  ): Promise<ReviewDocument> {
    await this.checkCanChange(id, user);
    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, {
        new: true,
        runValidators: true,
      })
      .exec();
    return updatedReview as ReviewDocument;
  }

  async remove(id: Types.ObjectId, user: PublicUser): Promise<void> {
    await this.checkCanChange(id, user);
    await this.reviewModel.findByIdAndDelete(id).exec();
  }

  async getRatingStats(
    filter: RatingStatsFilterDto,
  ): Promise<ProductRatingDto[]> {
    const minRating = filter.minRating ?? 1;

    const groups = await this.reviewModel.aggregate<RatingGroup>([
      { $match: { rating: { $gte: minRating } } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewsCount: { $sum: 1 },
        },
      },
      { $sort: { averageRating: -1, reviewsCount: -1 } },
    ]);

    const productIds = groups.map((group) => group._id);
    const productNames = await this.productsService.findNamesByIds(productIds);

    return groups.map((group) => ({
      productId: group._id,
      productName: productNames.get(group._id) ?? 'товар удалён',
      averageRating: Math.round(group.averageRating * 10) / 10,
      reviewsCount: group.reviewsCount,
    }));
  }

  private async checkCanChange(
    id: Types.ObjectId,
    user: PublicUser,
  ): Promise<void> {
    const review = await this.findOne(id);
    const isAuthor = review.authorId === user.id;
    const isAdmin = user.role === Role.Admin;
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Менять отзыв может только автор');
    }
  }
}
