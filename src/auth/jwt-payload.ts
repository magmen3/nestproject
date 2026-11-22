import { Role } from '../users/role';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
