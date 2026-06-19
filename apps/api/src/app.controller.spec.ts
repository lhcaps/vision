import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IS_PUBLIC_KEY } from './modules/auth/public.decorator';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [InfrastructureModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health info JSON', () => {
      const health = appController.getHello();
      expect(health).toMatchObject({
        status: 'ok',
        docs: '/api/docs',
      });
      expect(typeof health.name).toBe('string');
      expect(typeof health.version).toBe('string');
      expect(typeof health.uptimeSeconds).toBe('number');
    });
  });

  describe('health', () => {
    it('returns a stable liveness response', () => {
      const health = appController.getHealth();

      expect(health).toMatchObject({
        ok: true,
        service: 'QUANLYVKS API',
        env: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(health.timestamp))).toBe(false);
    });

    it('is public so startup probes work before authentication', () => {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, AppController)).toBe(true);
    });
  });
});
