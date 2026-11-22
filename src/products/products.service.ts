import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product';

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private nextId = 1;

  create(createProductDto: CreateProductDto): Product {
    const newProduct: Product = { id: this.nextId, ...createProductDto };
    this.nextId = this.nextId + 1;
    this.products.push(newProduct);
    return newProduct;
  }

  findAll(filter: ProductFilterDto): Product[] {
    let foundProducts = this.products;

    if (filter.category) {
      foundProducts = foundProducts.filter(
        (product) => product.category === filter.category,
      );
    }

    if (filter.maxPrice) {
      const maxPrice = filter.maxPrice;
      foundProducts = foundProducts.filter(
        (product) => product.price <= maxPrice,
      );
    }

    return foundProducts;
  }

  findOne(id: number): Product {
    const product = this.products.find((product) => product.id === id);
    if (!product) {
      throw new NotFoundException(`Товар с id ${id} не найден`);
    }
    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto): Product {
    const product = this.findOne(id);
    Object.assign(product, updateProductDto);
    return product;
  }

  remove(id: number): void {
    const product = this.findOne(id);
    this.products = this.products.filter((item) => item !== product);
  }
}
