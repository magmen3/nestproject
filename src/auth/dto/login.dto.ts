import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ivan@example.com' })
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  password: string;
}
