import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("VisionFlow API")
    .setDescription("Computer vision dataset, pipeline, inference, and evaluation API.")
    .setVersion("0.1.0")
    .addTag("health")
    .addTag("projects")
    .addTag("media")
    .addTag("datasets")
    .addTag("annotations")
    .addTag("pipelines")
    .addTag("inference")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
