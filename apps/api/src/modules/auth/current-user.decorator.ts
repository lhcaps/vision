import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser as CurrentUserType } from './current-user.type';

/**
 * Lấy thông tin user hiện tại từ request (do AuthGuard set).
 * Sử dụng: @CurrentUser() user: CurrentUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { currentUser?: CurrentUserType }>();
    return request.currentUser ?? null;
  },
);
