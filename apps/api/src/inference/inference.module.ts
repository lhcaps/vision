import { Module } from "@nestjs/common";
import { DatasetsModule } from "../datasets/datasets.module";
import { MediaModule } from "../media/media.module";
import { PipelinesModule } from "../pipelines/pipelines.module";
import { CvWorkerClient } from "./cv-worker.client";
import { InferenceController } from "./inference.controller";
import { InferenceService } from "./inference.service";

@Module({
  imports: [DatasetsModule, MediaModule, PipelinesModule],
  controllers: [InferenceController],
  providers: [CvWorkerClient, InferenceService],
})
export class InferenceModule {}
