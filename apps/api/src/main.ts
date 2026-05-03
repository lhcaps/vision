import 'reflect-metadata';
import './config/load-env';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import type { RequestHandler } from 'express';
import { AppModule } from './app.module';
import { GlobalErrorFilter } from './common/interceptors/error.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { createLogger } from './common/logging/structured-logger';

const logger = createLogger('bootstrap');

async function bootstrap() {
  const port = Number(process.env.API_PORT ?? 3000);
  logger.info(
    {
      environment: process.env.NODE_ENV ?? 'development',
      port,
      logLevel: process.env.LOG_LEVEL ?? 'info',
    },
    'Starting VisionFlow API'
  );

  logger.info('Creating Nest application (DI + module bootstrap)');
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });
  logger.info('Nest application created');

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );
  app.useGlobalFilters(new GlobalErrorFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  app.getHttpAdapter().getInstance().disable('etag');

  const noCacheMiddleware: RequestHandler = (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  };
  app.use(noCacheMiddleware);

  const webOrigin = process.env.WEB_ORIGIN;
  const allowedOrigins = webOrigin
    ? webOrigin.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  logger.info({ allowedOrigins }, 'CORS configured');

  const config = new DocumentBuilder()
    .setTitle('VisionFlow API')
    .setDescription('Computer vision dataset, pipeline, inference, and evaluation API.')
    .setVersion('0.1.0')
    .addTag('health')
    .addTag('projects')
    .addTag('media')
    .addTag('datasets')
    .addTag('annotations')
    .addTag('pipelines')
    .addTag('inference')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  logger.info({ port }, 'Starting HTTP listener');
  await app.listen(port);
  logger.info({ port, docs: '/api/docs' }, 'VisionFlow API ready');
}

bootstrap().catch((error) => {
  logger.error({ stack: error.stack }, `Bootstrap failed: ${error.message}`);
  process.exit(1);
});
