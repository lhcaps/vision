import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { ApplicationErrorFilter } from './common/application-error.filter';
import { createCorsOriginValidator } from './common/cors-origin';
import { requestContextMiddleware } from './common/request-context.middleware';
import { createGlobalValidationPipe } from './common/validation-pipe.factory';
import { AppConfigService } from './infrastructure/config/app-config.service';

loadEnv({ path: resolve(process.cwd(), '..', '..', '.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const bootstrapConfig = new AppConfigService(process.env);
  bootstrapConfig.assertProductionSafety();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(AppConfigService);
  const corsPolicy = config.corsPolicy;

  // --- CORS ---
  app.enableCors({
    origin: corsPolicy.allowAll ? true : createCorsOriginValidator(corsPolicy),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-Request-Id',
    ],
  });

  if (!config.isProduction) {
    logger.log(
      `Allowed CORS origins: ${
        corsPolicy.allowAll ? '*' : corsPolicy.origins.join(', ')
      }`,
    );
  }

  // --- Cookies (cho session auth) ---
  app.use(cookieParser());

  // --- Request correlation and stable error responses ---
  app.use(requestContextMiddleware);
  app.useGlobalFilters(new ApplicationErrorFilter());

  // --- Global prefix ---
  const globalPrefix = config.apiGlobalPrefix;
  app.setGlobalPrefix(globalPrefix);

  // --- Validation ---
  app.useGlobalPipes(createGlobalValidationPipe());

  // --- Swagger ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QUANLYVKS API')
    .setDescription(
      'Offline VKS case management and document template automation API',
    )
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  if (config.isSwaggerEnabled) {
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  const port = config.apiPort;
  await app.listen(port);

  logger.log(
    `QUANLYVKS API is running on http://localhost:${port}/${globalPrefix}`,
  );
}

void bootstrap();
