import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicUser } from './public-user';
import { Role } from './role';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    passwordHash: string,
    role: Role = Role.User,
  ): Promise<PublicUser> {
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже есть');
    }
    const savedUser = await this.usersRepository.save({
      email,
      passwordHash,
      role,
    });
    return { id: savedUser.id, email: savedUser.email, role: savedUser.role };
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }
}
