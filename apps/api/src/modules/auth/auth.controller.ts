import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser as CurrentUserDecorator } from './current-user.decorator';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password.util';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' })
  newPassword!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập bằng tên Kiểm sát viên (full_name match)',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, set cookie' })
  @ApiResponse({ status: 401, description: 'Sai username hoac password' })
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: CurrentUser; expiresAt: string }> {
    if (!body?.username || typeof body.username !== 'string') {
      throw new BadRequestException('Thiếu username.');
    }

    if (!body?.password || typeof body.password !== 'string') {
      throw new BadRequestException('Thieu password.');
    }

    const user = await this.authService.findOfficialByCredentials(
      body.username,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException(
        'Username không tồn tại hoặc đã bị khoá.',
      );
    }

    const ipAddress =
      (request.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      request.socket?.remoteAddress ??
      null;
    const userAgent = request.headers['user-agent'] ?? null;

    const { token, expiresAt } = await this.authService.createSession({
      officialId: user.id,
      ipAddress,
      userAgent,
    });

    const cookieOpts = this.authService.getCookieOptions();
    const cookieSetOptions: CookieOptions = {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    };
    if (cookieOpts.domain) {
      cookieSetOptions.domain = cookieOpts.domain;
    }
    response.cookie(cookieOpts.name, token, cookieSetOptions);

    return { user, expiresAt: expiresAt.toISOString() };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (xoá session)' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const cookieOpts = this.authService.getCookieOptions();
    const token = (request as Request & { cookies?: Record<string, string> })
      .cookies?.[cookieOpts.name];
    if (token) {
      await this.authService.destroySession(token);
    }
    const clearOpts: CookieOptions = { path: '/' };
    if (cookieOpts.domain) {
      clearOpts.domain = cookieOpts.domain;
    }
    response.clearCookie(cookieOpts.name, clearOpts);
    return { ok: true };
  }

  @Public()
  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  me(@CurrentUserDecorator() user: CurrentUser | null): CurrentUser | null {
    return user;
  }

  @Get('users')
  @ApiOperation({
    summary: 'Danh sách KSV (officials) cho dropdowns, picker, ...',
  })
  async listUsers(): Promise<
    {
      id: string;
      fullName: string;
      positionTitle: string | null;
      agencyName: string | null;
    }[]
  > {
    const rows = await this.prisma.officials.findMany({
      where: { is_active: true },
      include: { agencies: { select: { agency_name: true } } },
      orderBy: { full_name: 'asc' },
    });
    return rows.map((o) => ({
      id: String(o.id),
      fullName: o.full_name,
      positionTitle: o.position_title,
      agencyName: o.agencies?.agency_name ?? null,
    }));
  }

  // Endpoint /auth/agency yêu cầu đăng nhập - thông tin agency là nội bộ
  @Get('agency')
  @ApiOperation({ summary: 'Agency hiện tại (lấy official đầu tiên active)' })
  async currentAgency(@CurrentUserDecorator() user: CurrentUser): Promise<{
    id: string;
    name: string;
    code: string | null;
    parentName: string | null;
  } | null> {
    if (!user?.agencyId) return null;

    const agency = await this.prisma.agencies.findUnique({
      where: { id: BigInt(user.agencyId) },
      include: {
        agencies: true,
      },
    });
    if (!agency) return null;
    return {
      id: String(agency.id),
      name: agency.agency_name,
      code: agency.agency_code,
      parentName: agency.agencies?.agency_name ?? null,
    };
  }

  /**
   * Đổi mật khẩu cho user hiện tại. Sau khi đổi, mọi session khác (thiết bị
   * khác) sẽ bị buộc đăng xuất; session hiện tại vẫn hoạt động.
   *
   * Rate-limit cao hơn login (3/phút) — chống brute force local.
   */
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đổi mật khẩu (giữ session hiện tại, xoá các session khác)',
  })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 401, description: 'Sai mật khẩu hiện tại' })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() request: Request,
  ): Promise<{ ok: true; revokedOtherSessions: number }> {
    if (!user) {
      throw new UnauthorizedException('Chưa đăng nhập.');
    }
    if (!body?.currentPassword || !body?.newPassword) {
      throw new BadRequestException(
        'Thiếu mật khẩu hiện tại hoặc mật khẩu mới.',
      );
    }
    if (body.currentPassword === body.newPassword) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại.',
      );
    }

    const official = await this.prisma.officials.findUnique({
      where: { id: BigInt(user.id) },
    });
    if (!official || !official.password_hash) {
      throw new UnauthorizedException('Tài khoản không hợp lệ.');
    }
    if (!verifyPassword(body.currentPassword, official.password_hash)) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
    }

    const newHash = hashPassword(body.newPassword);
    await this.prisma.officials.update({
      where: { id: BigInt(user.id) },
      data: { password_hash: newHash },
    });

    const cookieName = this.authService.getCookieOptions().name;
    const currentToken = (
      request as Request & { cookies?: Record<string, string> }
    ).cookies?.[cookieName];
    const revoked = await this.authService.revokeOtherSessions(
      user.id,
      currentToken,
    );

    this.logger.log(
      `Password changed for official=${user.id}; revoked ${revoked} other session(s).`,
    );

    return { ok: true, revokedOtherSessions: revoked };
  }
}
