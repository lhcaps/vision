import { AuthService } from './auth.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { hashPassword } from './password.util';

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

function createPrismaMock() {
  return {
    officials: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    $executeRaw: jest.fn().mockResolvedValue(0),
    $queryRaw: jest.fn(),
  };
}

describe('AuthService credential login', () => {
  it('returns the official only when username and password match', async () => {
    const prisma = createPrismaMock();
    prisma.officials.findFirst.mockResolvedValue(baseOfficial);
    const service = new AuthService(prisma as never);

    await expect(
      service.findOfficialByCredentials('kiem-sat-vien', 'wrong'),
    ).resolves.toBeNull();

    await expect(
      service.findOfficialByCredentials('kiem-sat-vien', 'Secret123!'),
    ).resolves.toMatchObject({
      id: '7',
      fullName: 'Kiểm sát viên',
      role: 'ADMIN',
      agencyId: '3',
    });
  });

  it('does not allow login for users without a password hash', async () => {
    const prisma = createPrismaMock();
    prisma.officials.findFirst.mockResolvedValue({
      ...baseOfficial,
      password_hash: null,
    });
    const service = new AuthService(prisma as never);

    await expect(
      service.findOfficialByCredentials('kiem-sat-vien', 'Secret123!'),
    ).resolves.toBeNull();
  });
});

describe('AuthService session revocation', () => {
  it('revokes all sessions for an official when no keep token is provided', async () => {
    const prisma = createPrismaMock();
    prisma.$executeRaw.mockResolvedValueOnce(2);
    const service = new AuthService(prisma as never);

    const result = await service.revokeOtherSessions('7');
    expect(result).toBe(2);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('returns 0 when officialId is not a valid bigint', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma as never);

    const result = await service.revokeOtherSessions('not-a-bigint');
    expect(result).toBe(0);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('keeps the current session when keepRawToken is provided', async () => {
    const prisma = createPrismaMock();
    prisma.$executeRaw.mockResolvedValueOnce(1);
    const service = new AuthService(prisma as never);

    const result = await service.revokeOtherSessions('7', 'current-token');
    expect(result).toBe(1);
  });

  it('revokeAllSessions deletes every session of the official', async () => {
    const prisma = createPrismaMock();
    prisma.$executeRaw.mockResolvedValueOnce(4);
    const service = new AuthService(prisma as never);

    const result = await service.revokeAllSessions('7');
    expect(result).toBe(4);
  });
});

describe('AuthService getCookieOptions', () => {
  it('omits domain when AUTH_COOKIE_DOMAIN is unset', () => {
    const service = new AuthService({} as never, new AppConfigService({}));
    const opts = service.getCookieOptions();
    expect(opts.domain).toBeUndefined();
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe('/');
  });

  it('includes domain when AUTH_COOKIE_DOMAIN is set', () => {
    const service = new AuthService(
      {} as never,
      new AppConfigService({
        AUTH_COOKIE_DOMAIN: '.qlv.local',
        AUTH_SESSION_COOKIE_NAME: 'custom_session',
        AUTH_SESSION_TTL_DAYS: '30',
      }),
    );
    const opts = service.getCookieOptions();
    expect(opts.domain).toBe('.qlv.local');
    expect(opts.name).toBe('custom_session');
    expect(opts.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
