import { Module } from "@nestjs/common";
import { DatasetsModule } from "../datasets/datasets.module";
import { PipelinesModule } from "../pipelines/pipelines.module";
import { InferenceController } from "./inference.controller";
import { InferenceService } from "./inference.service";

@Module({
  imports: [DatasetsModule, PipelinesModule],
  controllers: [InferenceController],
  providers: [InferenceService],
})
export class InferenceModule {}
