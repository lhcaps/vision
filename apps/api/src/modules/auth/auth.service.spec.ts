import { AuthService } from './auth.service';
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
    const original = process.env.AUTH_COOKIE_DOMAIN;
    delete process.env.AUTH_COOKIE_DOMAIN;

    try {
      const service = new AuthService({} as never);
      const opts = service.getCookieOptions();
      expect(opts.domain).toBeUndefined();
      expect(opts.httpOnly).toBe(true);
      expect(opts.path).toBe('/');
    } finally {
      if (original !== undefined) process.env.AUTH_COOKIE_DOMAIN = original;
    }
  });

  it('includes domain when AUTH_COOKIE_DOMAIN is set', () => {
    const original = process.env.AUTH_COOKIE_DOMAIN;
    process.env.AUTH_COOKIE_DOMAIN = '.qlv.local';

    try {
      const service = new AuthService({} as never);
      const opts = service.getCookieOptions();
      expect(opts.domain).toBe('.qlv.local');
    } finally {
      if (original === undefined) delete process.env.AUTH_COOKIE_DOMAIN;
      else process.env.AUTH_COOKIE_DOMAIN = original;
    }
  });
});
