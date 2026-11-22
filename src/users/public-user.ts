import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role';

export class PublicUser {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ivan@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.User })
  role: Role;
}
