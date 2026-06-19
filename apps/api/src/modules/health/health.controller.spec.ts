import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('is public so readiness can be checked before authentication', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, HealthController)).toBe(true);
  });

  it.each([
    [true, 200],
    [false, 503],
  ])(
    'returns readiness body with the matching HTTP status when ok=%s',
    async (ok, expectedStatus) => {
      const readiness = {
        getReadiness: jest.fn().mockResolvedValue({ ok }),
      };
      const response = {
        status: jest.fn(),
      };
      const controller = new HealthController(readiness as never);

      await expect(
        controller.getReadiness(response as never),
      ).resolves.toEqual({ ok });
      expect(response.status).toHaveBeenCalledWith(expectedStatus);
    },
  );
});
