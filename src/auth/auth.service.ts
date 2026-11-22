import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PublicUser } from '../users/public-user';
import { UsersService } from '../users/users.service';
import { AccessTokenDto } from './dto/access-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(registerDto.password, SALT_ROUNDS);
    return this.usersService.create(registerDto.email, passwordHash);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      return null;
    }
    const passwordIsCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!passwordIsCorrect) {
      return null;
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  login(user: PublicUser): AccessTokenDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
