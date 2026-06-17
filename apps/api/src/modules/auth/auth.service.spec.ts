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
    $executeRaw: jest.fn(),
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
