import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Đánh dấu route không cần authentication.
 * Dùng cho /auth/login, /auth/me (sau khi có token), /health, ...
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
