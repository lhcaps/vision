import { Module } from "@nestjs/common";
import { DatasetsModule } from "./datasets/datasets.module";
import { HealthModule } from "./health/health.module";
import { InferenceModule } from "./inference/inference.module";
import { MediaModule } from "./media/media.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    ProjectsModule,
    MediaModule,
    DatasetsModule,
    InferenceModule,
  ],
})
export class AppModule {}
