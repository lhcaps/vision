import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
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
});
