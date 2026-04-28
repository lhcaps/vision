import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { InferenceModule } from "./inference/inference.module";
import { MediaModule } from "./media/media.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [PrismaModule, HealthModule, ProjectsModule, MediaModule, InferenceModule],
})
export class AppModule {}
