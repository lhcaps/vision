import 'reflect-metadata';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { hashPassword, verifyPassword } from './password.util';
import { generateSessionToken } from './token.util';

const THROTTLER_LIMIT_DEFAULT = 'THROTTLER:LIMITdefault';
const THROTTLER_TTL_DEFAULT = 'THROTTLER:TTLdefault';

const baseOfficial = {
  id: BigInt(7),
  full_name: 'Kiểm sát viên',
  username: 'kiem-sat-vien',
  password_hash: hashPassword('Secret123!'),
  role: 'ADMIN',
  position_title: 'Kiểm sát viên',
  rank_title: null,
  email: null,
  phone: null,
  is_active: true,
  agencies: {
    id: BigInt(3),
    agency_name: 'Viện kiểm sát khu vực 7',
    agency_code: 'VKSKV7',
  },
};

function createPrismaMock(overrides: Partial<{ officials: any }> = {}) {
  return {
    officials: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue(baseOfficial),
      ...(overrides.officials ?? {}),
    },
    $executeRaw: jest.fn().mockResolvedValue(0),
    $queryRaw: jest.fn(),
  };
}

function createAuthServiceMock(overrides: Partial<{ revokeOtherSessions: any }> = {}) {
  return {
    findOfficialByCredentials: jest.fn(),
    createSession: jest.fn(),
    destroySession: jest.fn().mockResolvedValue(undefined),
    revokeOtherSessions: jest.fn().mockResolvedValue(2),
    getCookieOptions: jest.fn().mockReturnValue({
      name: 'qlv_session',
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      maxAge: 60_000,
      path: '/',
    }),
    ...overrides,
  };
}

describe('AuthController throttling', () => {
  it('limits login to five attempts per minute', () => {
    const loginHandler = AuthController.prototype.login;

    expect(Reflect.getMetadata(THROTTLER_LIMIT_DEFAULT, loginHandler)).toBe(5);
    expect(Reflect.getMetadata(THROTTLER_TTL_DEFAULT, loginHandler)).toBe(
      60_000,
    );
  });

  it('limits change-password to three attempts per minute', () => {
    const changePasswordHandler = AuthController.prototype.changePassword;

    expect(Reflect.getMetadata(THROTTLER_LIMIT_DEFAULT, changePasswordHandler)).toBe(3);
    expect(Reflect.getMetadata(THROTTLER_TTL_DEFAULT, changePasswordHandler)).toBe(
      60_000,
    );
  });
});

describe('AuthController changePassword', () => {
  const currentUser = {
    id: '7',
    username: 'kiem-sat-vien',
    fullName: 'KSV',
    positionTitle: null,
    rankTitle: null,
    email: null,
    phone: null,
    role: 'ADMIN' as const,
    agencyId: '3',
    agencyName: 'VKS',
    agencyCode: 'VKSKV7',
    isActive: true,
  };

  it('updates password and revokes other sessions when current is correct', async () => {
    const prisma = createPrismaMock();
    prisma.officials.findUnique.mockResolvedValue(baseOfficial);
    const auth = createAuthServiceMock();
    const controller = new AuthController(auth as never, prisma as never);

    const request = {
      cookies: { qlv_session: 'current-raw-token' },
    } as never;

    const result = await controller.changePassword(
      { currentPassword: 'Secret123!', newPassword: 'BrandNewP@ss123' },
      currentUser,
      request,
    );

    expect(result).toEqual({ ok: true, revokedOtherSessions: 2 });
    expect(prisma.officials.update).toHaveBeenCalledTimes(1);
    expect(prisma.officials.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(7) },
        data: { password_hash: expect.stringMatching(/^scrypt:/) },
      }),
    );
    expect(auth.revokeOtherSessions).toHaveBeenCalledWith('7', 'current-raw-token');
  });

  it('rejects when current password is wrong', async () => {
    const prisma = createPrismaMock();
    prisma.officials.findUnique.mockResolvedValue(baseOfficial);
    const auth = createAuthServiceMock();
    const controller = new AuthController(auth as never, prisma as never);

    await expect(
      controller.changePassword(
        { currentPassword: 'WrongPass!', newPassword: 'BrandNewP@ss123' },
        currentUser,
        {} as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.officials.update).not.toHaveBeenCalled();
    expect(auth.revokeOtherSessions).not.toHaveBeenCalled();
  });

  it('rejects when new and current are the same', async () => {
    const prisma = createPrismaMock();
    const auth = createAuthServiceMock();
    const controller = new AuthController(auth as never, prisma as never);

    await expect(
      controller.changePassword(
        { currentPassword: 'Secret123!', newPassword: 'Secret123!' },
        currentUser,
        {} as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when user is not authenticated', async () => {
    const prisma = createPrismaMock();
    const auth = createAuthServiceMock();
    const controller = new AuthController(auth as never, prisma as never);

    await expect(
      controller.changePassword(
        { currentPassword: 'Secret123!', newPassword: 'BrandNewP@ss123' },
        null as never,
        {} as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('produces a hash that verifies the new password', async () => {
    const prisma = createPrismaMock();
    prisma.officials.findUnique.mockResolvedValue(baseOfficial);

    let storedHash = '';
    prisma.officials.update.mockImplementation(({ data }: { data: any }) => {
      storedHash = data.password_hash;
      return Promise.resolve({ ...baseOfficial, password_hash: storedHash });
    });

    const auth = createAuthServiceMock();
    const controller = new AuthController(auth as never, prisma as never);

    await controller.changePassword(
      { currentPassword: 'Secret123!', newPassword: 'BrandNewP@ss123' },
      currentUser,
      {} as never,
    );

    expect(storedHash).toMatch(/^scrypt:/);
    expect(verifyPassword('BrandNewP@ss123', storedHash)).toBe(true);
    expect(verifyPassword('Secret123!', storedHash)).toBe(false);
  });
});

describe('AuthService session token generation', () => {
  it('produces distinct raw tokens', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});
