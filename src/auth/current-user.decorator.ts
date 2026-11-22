import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { PublicUser } from '../users/public-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): PublicUser => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as PublicUser;
  },
);
