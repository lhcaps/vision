import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { envOrDefault } from './common/env.util';

loadEnv({ path: resolve(process.cwd(), '..', '..', '.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  // --- CORS ---
  const corsOrigin = envOrDefault('API_CORS_ORIGIN', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  });

  // --- Cookies (cho session auth) ---
  app.use(cookieParser());

  // --- Global prefix ---
  const globalPrefix = envOrDefault('API_GLOBAL_PREFIX', 'api/v1');
  app.setGlobalPrefix(globalPrefix);

  // --- Validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // --- Swagger ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QUANLYVKS API')
    .setDescription(
      'Offline VKS case management and document template automation API',
    )
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = Number(envOrDefault('API_PORT', '3001'));
  await app.listen(port);

  logger.log(
    `QUANLYVKS API is running on http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
