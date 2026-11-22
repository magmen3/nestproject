import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'books', description: 'Название категории' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
