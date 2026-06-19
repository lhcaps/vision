import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { envIntOrDefault, envBoolOrDefault } from '../../common/env.util';
import { generateSessionToken, hashSessionToken } from './token.util';
import { PublicUser } from './current-user.type';
import { verifyPassword } from './password.util';

const SESSION_TTL_DAYS = envIntOrDefault('AUTH_SESSION_TTL_DAYS', 14);
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const COOKIE_SECURE = envBoolOrDefault('AUTH_COOKIE_SECURE', false);

interface CreateSessionInput {
  officialId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tìm official theo username (fullName match lowercase, normalized).
   * Vì schema hiện không có cột `username`, dùng `full_name` (lower comparison) làm identity.
   */
  async findOfficialByCredentials(
    username: string,
    password: string,
  ): Promise<PublicUser | null> {
    const normalized = username.trim().toLowerCase();
    if (!normalized || !password) return null;

    const official = await this.prisma.officials.findFirst({
      where: {
        is_active: true,
        username: normalized,
      },
      include: {
        agencies: true,
      },
    });

    if (!official) return null;
    if (!verifyPassword(password, official.password_hash)) return null;
    return this.toPublicUser(official);
  }

  /**
   * Tạo session cho official (sau khi verify identity).
   */
  async createSession(input: CreateSessionInput): Promise<{
    token: string;
    expiresAt: Date;
    user: PublicUser;
  }> {
    const { raw, hash } = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.$executeRaw`
      INSERT INTO auth_sessions
        (token_hash, official_id, expires_at, ip_address, user_agent, created_at, updated_at)
      VALUES
        (${hash}, ${BigInt(input.officialId)}, ${expiresAt}, ${
          input.ipAddress ?? null
        }, ${input.userAgent ?? null}, NOW(), NOW())
    `;

    const user = await this.findOfficialById(input.officialId);
    if (!user) {
      throw new UnauthorizedException('Session user không hợp lệ.');
    }
    return { token: raw, expiresAt, user };
  }

  /**
   * Verify session token (raw) → trả PublicUser nếu hợp lệ, null nếu không.
   */
  async validateSession(rawToken: string): Promise<PublicUser | null> {
    if (!rawToken) return null;
    const hash = hashSessionToken(rawToken);

    const rows = await this.prisma.$queryRaw<
      Array<{
        official_id: bigint;
        expires_at: Date;
      }>
    >`
      SELECT official_id, expires_at
      FROM auth_sessions
      WHERE token_hash = ${hash}
      LIMIT 1
    `;
    const row = rows?.[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      // Hết hạn: dọn luôn
      await this.prisma.$executeRaw`
        DELETE FROM auth_sessions WHERE token_hash = ${hash}
      `;
      return null;
    }

    return this.findOfficialById(String(row.official_id));
  }

  /**
   * Xoá session (logout).
   */
  async destroySession(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const hash = hashSessionToken(rawToken);
    await this.prisma.$executeRaw`
      DELETE FROM auth_sessions WHERE token_hash = ${hash}
    `;
  }

  /**
   * Xoá TẤT CẢ sessions của một official (trừ session hiện tại nếu có).
   * Dùng khi đổi mật khẩu: buộc mọi thiết bị khác phải đăng nhập lại.
   * Trả về số session đã xoá.
   */
  async revokeOtherSessions(
    officialId: string,
    keepRawToken?: string,
  ): Promise<number> {
    let officialIdBig: bigint;
    try {
      officialIdBig = BigInt(officialId);
    } catch {
      return 0;
    }

    if (keepRawToken) {
      const keepHash = hashSessionToken(keepRawToken);
      const result = await this.prisma.$executeRaw`
        DELETE FROM auth_sessions
        WHERE official_id = ${officialIdBig}
          AND token_hash <> ${keepHash}
      `;
      this.logger.log(
        `Revoked ${result} other session(s) for official=${officialId} (kept current)`,
      );
      return Number(result ?? 0);
    }

    const result = await this.prisma.$executeRaw`
      DELETE FROM auth_sessions WHERE official_id = ${officialIdBig}
    `;
    this.logger.log(
      `Revoked all ${result} session(s) for official=${officialId}`,
    );
    return Number(result ?? 0);
  }

  /**
   * Xoá tất cả session của official (kể cả session hiện tại).
   * Dùng khi disable account.
   */
  async revokeAllSessions(officialId: string): Promise<number> {
    let officialIdBig: bigint;
    try {
      officialIdBig = BigInt(officialId);
    } catch {
      return 0;
    }

    const result = await this.prisma.$executeRaw`
      DELETE FROM auth_sessions WHERE official_id = ${officialIdBig}
    `;
    return Number(result ?? 0);
  }

  /**
   * Cookie options cho session.
   * `domain` được đọc từ env `AUTH_COOKIE_DOMAIN` (optional). Không set mặc định
   * để cookie chỉ gắn vào exact host (an toàn cho single-origin deployment).
   * Set domain khi cần share cookie giữa subdomain (vd: app.qlv.local, api.qlv.local).
   */
  getCookieOptions() {
    const domain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
    return {
      name: process.env.AUTH_SESSION_COOKIE_NAME ?? 'qlv_session',
      secure: COOKIE_SECURE,
      httpOnly: true,
      sameSite:
        (process.env.AUTH_COOKIE_SAMESITE as
          | 'lax'
          | 'strict'
          | 'none'
          | undefined) ?? ('lax' as const),
      maxAge: SESSION_TTL_MS,
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private async findOfficialById(id: string): Promise<PublicUser | null> {
    let officialId: bigint;
    try {
      officialId = BigInt(id);
    } catch {
      return null;
    }

    const official = await this.prisma.officials.findUnique({
      where: { id: officialId },
      include: { agencies: true },
    });
    if (!official || !official.is_active) return null;
    return this.toPublicUser(official);
  }

  private toPublicUser(official: {
    id: bigint;
    username: string | null;
    password_hash?: string | null;
    full_name: string;
    role: string | null;
    position_title: string | null;
    rank_title: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    agencies: {
      id: bigint;
      agency_name: string;
      agency_code: string | null;
    } | null;
  }): PublicUser {
    // Use explicit role from DB. Fallback heuristic only for legacy rows
    // where role is NULL (migrated data from before this column existed).
    const rawRole = official.role ?? '';
    let role: 'ADMIN' | 'OFFICIAL';
    if (rawRole === 'ADMIN') {
      role = 'ADMIN';
    } else if (rawRole === 'OFFICIAL') {
      role = 'OFFICIAL';
    } else {
      // Legacy fallback: keep old heuristic so existing data isn't broken
      const lowerPosition = (official.position_title ?? '').toLowerCase();
      const lowerName = official.full_name.toLowerCase();
      const isHeadPosition =
        lowerPosition.startsWith('trưởng') ||
        lowerPosition.startsWith('viện trưởng');
      role = isHeadPosition || lowerName === 'admin' ? 'ADMIN' : 'OFFICIAL';
    }

    return {
      id: String(official.id),
      username: official.username,
      fullName: official.full_name,
      positionTitle: official.position_title,
      rankTitle: official.rank_title,
      email: official.email,
      phone: official.phone,
      role,
      agencyId: official.agencies ? String(official.agencies.id) : null,
      agencyName: official.agencies?.agency_name ?? null,
      agencyCode: official.agencies?.agency_code ?? null,
      isActive: official.is_active,
    };
  }
}
